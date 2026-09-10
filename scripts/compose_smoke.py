"""Test the actual Nginx -> FastAPI -> SQLite path, including a restart.

Run prepare, restart the backend, then verify. Creates one generated QA account.
"""
import json
import secrets
import sys
from pathlib import Path
import httpx

state = Path(__file__).resolve().parents[1] / 'tmp' / 'compose-smoke.json'
mode = sys.argv[1] if len(sys.argv) > 1 else 'prepare'
with httpx.Client(base_url='http://localhost:8080', timeout=20) as client:
    assert client.get('/').status_code == 200
    assert client.get('/api/health').json()['status'] == 'ok'
    if mode == 'prepare':
        credentials = {'name': 'Container QA', 'email': f'qa-{secrets.token_hex(4)}@trace.local', 'password': secrets.token_urlsafe(24)}
        r = client.post('/api/auth/register', json=credentials)
        assert r.status_code == 201, r.text
        uid = r.json()['id']
        config = {'pairs': [{'key':0,'value':0},{'key':0,'value':0},{'key':0,'value':2}], 'rule':'delta'}
        result = client.post('/api/experiments/run', json=config).json()
        assert result['steps'][-1]['prediction'] == 2
        r = client.post('/api/experiments', json={'name':'Container restart evidence','config':config})
        assert r.status_code == 201, r.text
        eid = r.json()['id']
        assert client.put('/api/progress', json={'completed':[0,1]}).status_code == 200
        state.parent.mkdir(exist_ok=True)
        state.write_text(json.dumps({'credentials':credentials, 'experiment_id':eid, 'user_id':uid, 'cookie':client.cookies.get('trace_session')}))
        print('PASS: Nginx, API, registration, live inference, save and progress. Ready for backend restart.')
    else:
        saved = json.loads(state.read_text())
        # The session itself must also survive the backend restart.
        client.cookies.set('trace_session',saved['cookie'])
        assert client.get('/api/auth/me').json()['id'] == saved['user_id']
        assert client.get('/api/progress').json()['completed'] == [0,1]
        result = client.get(f"/api/experiments/{saved['experiment_id']}").json()
        assert result['result']['steps'][-1]['prediction'] == 2
        assert result['name'] == 'Container restart evidence'
        assert client.delete(f"/api/experiments/{saved['experiment_id']}").status_code == 200
        assert client.post('/api/auth/logout').status_code == 200
        assert client.get('/api/auth/me').status_code == 401
        assert client.post('/api/auth/login', json=saved['credentials']).status_code == 200
        assert client.post('/api/auth/logout').status_code == 200
        print('PASS: persisted session, account, progress and saved result after restart; delete, logout and login.')
