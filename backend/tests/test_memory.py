import numpy as np
import pytest
from app.model import Experiment, MemoryModel


@pytest.fixture(scope='module')
def model():
    return MemoryModel()


def test_distinct_keys_recall_all_values(model):
    pairs = [{'key': i, 'value': (i + 3) % 8} for i in range(8)]
    for query in range(8):
        r = model.run(Experiment(pairs=pairs, query=query))
        assert r['steps'][-1]['prediction'] == (query + 3) % 8
        assert r['steps'][-1]['accuracy'] == 1
        assert r['state_cells'] == 72


def test_collision_and_delta_recovery(model):
    pairs = [{'key': 0, 'value': 0}, {'key': 0, 'value': 0}, {'key': 0, 'value': 2}]
    hebb = model.run(Experiment(pairs=pairs))
    delta = model.run(Experiment(pairs=pairs, rule='delta'))
    assert hebb['steps'][-1]['prediction'] == 0
    assert hebb['steps'][-1]['correct'] is False
    assert delta['steps'][-1]['prediction'] == 2
    assert delta['steps'][-1]['correct'] is True


def test_overlapping_cues_cause_interference(model):
    pairs = [{'key': 0, 'value': 0}] + [{'key': i, 'value': 2} for i in range(1, 4)]
    assert model.run(Experiment(pairs=pairs))['steps'][-1]['prediction'] == 0
    assert model.run(Experiment(pairs=pairs, overlap=.85))['steps'][-1]['prediction'] == 2


def test_no_write_has_no_signal(model):
    r = model.run(Experiment(pairs=[{'key': 0, 'value': 1}], strength=0))
    assert r['steps'][-1]['prediction'] is None
    assert r['steps'][-1]['norm'] == 0


def test_retention_erases_old_orthogonal_memory(model):
    r = model.run(Experiment(pairs=[{'key': 0, 'value': 0}, {'key': 1, 'value': 1}], retention=0))
    assert r['steps'][1]['prediction'] == 0
    assert r['steps'][2]['prediction'] is None


def test_reproducible_noise_and_fixed_weights(model):
    config = Experiment(pairs=[{'key': i % 8, 'value': i % 8} for i in range(32)], noise=.3, seed=73)
    before = model.w.copy()
    a, b = model.run(config), model.run(config)
    assert a['steps'] == b['steps']
    assert a['query_vector'] == b['query_vector']
    np.testing.assert_array_equal(before, model.w)
    assert len(a['steps']) == 33
    assert all(np.array(s['matrix']).shape == (9, 8) for s in a['steps'])
    assert model.metrics['test_accuracy'] > .97


def test_delta_exact_latest_value_with_orthogonal_key(model):
    r = model.run(Experiment(pairs=[{'key': 3, 'value': 2}, {'key': 3, 'value': 7}], rule='delta', query=3))
    np.testing.assert_allclose(r['steps'][-1]['readout'], model.codes[7], atol=1e-5)
