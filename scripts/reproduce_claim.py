"""Reproduce TRACE's collision claim with the distributed model, without UI."""
import json
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]/'backend'))
from app.model import Experiment, MemoryModel

model = MemoryModel()
e = dict(pairs=[dict(key=0,value=0),dict(key=0,value=0),dict(key=0,value=2)])
for rule in ('hebbian', 'delta'):
    result = model.run(Experiment(**e, rule=rule))
    last = result['steps'][-1]
    assert last['prediction'] == (0 if rule == 'hebbian' else 2)
    assert result['state_cells'] == 72 and result['state_bytes'] == 576
    print(json.dumps({'rule':rule, 'recall':result['values'][last['prediction']], 'target':result['values'][last['expected']], 'state_cells':result['state_cells'], 'state_bytes':result['state_bytes'], 'model_sha256':result['model_sha256']}, indent=2))
