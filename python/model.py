"""A trained symbol decoder around an inspectable fast-weight memory.

This is an educational associative-memory model, NOT an implementation of BDH.
Training changes W,b. Experiments change M only. See docs/MODEL_CARD.md.
"""
import hashlib
import json
import os
import time
from pathlib import Path

import numpy as np
from pydantic import BaseModel, Field
from typing import Literal

ARTIFACTS = Path(os.getenv('MODEL_DIR', Path(__file__).resolve().parents[1] / 'artifacts'))
KEYS = ['Atlas', 'Birch', 'Coral', 'Drift', 'Ember', 'Fern', 'Grove', 'Halo']
VALUES = ['Amber', 'Mint', 'Violet', 'Rose', 'Sky', 'Lime', 'Peach', 'Pearl']


def softmax(x):
    e = np.exp(x - np.max(x, axis=-1, keepdims=True))
    return e / e.sum(axis=-1, keepdims=True)


def train():
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(42)
    codes, _ = np.linalg.qr(rng.normal(size=(8, 8)))
    # Independent synthetic train and test draws; no test samples in optimization.
    y = rng.integers(0, 8, 6000)
    x = codes[y] + rng.normal(0, .18, (6000, 8))
    yt = rng.integers(0, 8, 1500)
    xt = codes[yt] + rng.normal(0, .18, (1500, 8))
    w = rng.normal(0, .01, (8, 8))
    b = np.zeros(8)
    target = np.eye(8)[y]
    history = []
    for epoch in range(201):
        p = softmax(x @ w + b)
        if epoch % 10 == 0:
            history.append({'epoch': epoch, 'loss': round(float(-np.log(p[np.arange(len(y)), y] + 1e-12).mean()), 5)})
        if epoch < 200:
            grad = (p - target) / len(y)
            w -= .7 * (x.T @ grad + .0001 * w)
            b -= .7 * grad.sum(axis=0)
    accuracy = float(((xt @ w + b).argmax(axis=1) == yt).mean())
    np.savez_compressed(ARTIFACTS / 'decoder.npz', codes=codes, w=w, b=b)
    np.savez_compressed(ARTIFACTS / 'synthetic_dataset.npz', x_train=x, y_train=y, x_test=xt, y_test=yt)
    digest = hashlib.sha256((ARTIFACTS / 'decoder.npz').read_bytes()).hexdigest()
    metrics = {'name': 'TRACE Symbol Decoder', 'version': '1.0.0', 'seed': 42, 'train_samples': 6000,
               'test_samples': 1500, 'epochs': 200, 'parameters': 72, 'test_accuracy': accuracy,
               'noise_std': .18, 'history': history, 'sha256': digest,
               'scope': 'Synthetic noisy-symbol classification. This accuracy is not memory-retrieval accuracy or a BDH benchmark.'}
    (ARTIFACTS / 'metrics.json').write_text(json.dumps(metrics, indent=2))
    return metrics


class Pair(BaseModel):
    key: int = Field(ge=0, le=7)
    value: int = Field(ge=0, le=7)


class Experiment(BaseModel):
    pairs: list[Pair] = Field(min_length=1, max_length=32)
    query: int = Field(default=0, ge=0, le=7)
    retention: float = Field(default=1, ge=0, le=1)
    overlap: float = Field(default=0, ge=0, le=1)
    noise: float = Field(default=0, ge=0, le=.8)
    strength: float = Field(default=1, ge=0, le=1)
    rule: Literal['hebbian', 'delta'] = 'hebbian'
    seed: int = Field(default=42, ge=0, le=1000000)


class MemoryModel:
    def __init__(self):
        if not (ARTIFACTS / 'decoder.npz').exists():
            train()
        with np.load(ARTIFACTS / 'decoder.npz', allow_pickle=False) as f:
            self.codes, self.w, self.b = f['codes'], f['w'], f['b']
        self.metrics = json.loads((ARTIFACTS / 'metrics.json').read_text())

    def run(self, e: Experiment):
        start = time.perf_counter()
        keys = np.concatenate([np.eye(8) * np.sqrt(1 - e.overlap), np.full((8, 1), np.sqrt(e.overlap))], axis=1)
        q = keys[e.query] + np.random.default_rng(e.seed).normal(0, e.noise, 9)
        q = q / max(np.linalg.norm(q), 1e-12)
        m = np.zeros((9, 8))
        seen = {}
        steps = []
        def snapshot(index, update):
            raw = q @ m
            probabilities = softmax(raw @ self.w + self.b)
            has_signal = bool(np.linalg.norm(raw) > 1e-8)
            prediction = int(probabilities.argmax()) if has_signal else None
            expected = seen.get(e.query)
            matches = []
            for key, val in seen.items():
                r = keys[key] @ m
                pred = int((r @ self.w + self.b).argmax()) if np.linalg.norm(r) > 1e-8 else None
                matches.append(pred == val)
            return {'index': index, 'matrix': m.round(5).tolist(), 'update': update.round(5).tolist(),
                    'readout': raw.round(5).tolist(), 'probabilities': probabilities.round(6).tolist(),
                    'prediction': prediction, 'expected': expected,
                    'correct': prediction == expected if expected is not None else None,
                    'accuracy': sum(matches) / len(matches) if matches else None,
                    'norm': round(float(np.linalg.norm(m)), 4), 'known_keys': len(seen)}
        steps.append(snapshot(0, m.copy()))
        for i, pair in enumerate(e.pairs):
            old = m.copy()
            m *= e.retention
            k, v = keys[pair.key], self.codes[pair.value]
            residual = v if e.rule == 'hebbian' else v - k @ m
            m += e.strength * np.outer(k, residual)
            seen[pair.key] = pair.value
            steps.append(snapshot(i + 1, m - old))
        # Explicit-token dot-product attention reference, using the same key geometry.
        attention = softmax(np.array([q @ keys[p.key] for p in e.pairs]) * 8)
        reference_raw = attention @ self.codes[[p.value for p in e.pairs]]
        reference = softmax(reference_raw @ self.w + self.b)
        return {'steps': steps, 'query_vector': q.round(5).tolist(), 'keys': KEYS, 'values': VALUES,
                'state_cells': 72, 'state_bytes': 72 * 8,
                'token_cache_cells': len(e.pairs) * 17,
                'reference': {'prediction': int(reference.argmax()), 'probabilities': reference.round(6).tolist(),
                              'attention': attention.round(5).tolist()},
                'elapsed_ms': round((time.perf_counter() - start) * 1000, 2),
                'model_version': self.metrics['version'], 'model_sha256': self.metrics['sha256'],
                'config': e.model_dump()}


if __name__ == '__main__':
    print(json.dumps(train(), indent=2))
