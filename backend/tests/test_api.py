import sqlite3
import pytest
from fastapi.testclient import TestClient
from app import main


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(main, 'DB', tmp_path / 'test.db')
    main.limits.clear()
    with TestClient(main.app) as client:
        yield client


DATA = {'email': 'ada@example.com', 'password': 'a-strong-test-password', 'name': 'Ada'}
CONFIG = {'pairs': [{'key': 0, 'value': 1}], 'query': 0}


def test_public_lab_validation_and_health(client):
    assert client.get('/api/health').json()['database'] == 'sqlite'
    assert client.post('/api/experiments/run', json=CONFIG).json()['steps'][-1]['prediction'] == 1
    assert client.post('/api/experiments/run', json={'pairs': []}).status_code == 422
    assert client.post('/api/experiments/run', json={'pairs': [{'key': 10, 'value': 0}]}).status_code == 422
    assert client.post('/api/experiments/run', json={**CONFIG, 'noise': 2}).status_code == 422
    assert client.get('/api/experiments').status_code == 401


def test_auth_persistence_and_logout(client):
    response = client.post('/api/auth/register', json=DATA)
    assert response.status_code == 201
    assert 'HttpOnly' in response.headers['set-cookie']
    assert 'SameSite=strict' in response.headers['set-cookie']
    assert client.get('/api/auth/me').json()['name'] == 'Ada'
    with sqlite3.connect(main.DB) as conn:
        stored = conn.execute('SELECT password FROM users').fetchone()[0]
        assert stored != DATA['password'] and ':' in stored
    saved = client.post('/api/experiments', json={'name': 'First result', 'config': CONFIG})
    assert saved.status_code == 201
    eid = saved.json()['id']
    assert client.get('/api/experiments').json()[0]['id'] == eid
    assert client.get(f'/api/experiments/{eid}').json()['result']['steps'][-1]['prediction'] == 1
    assert client.put('/api/progress', json={'completed': [0, 2]}).status_code == 200
    assert client.get('/api/progress').json()['completed'] == [0, 2]
    assert client.post('/api/auth/logout').status_code == 200
    assert client.get('/api/auth/me').status_code == 401
    assert client.post('/api/auth/login', json={**DATA, 'password': 'a-wrong-password'}).status_code == 401
    assert client.post('/api/auth/login', json=DATA).status_code == 200
    assert client.get('/api/experiments').json()[0]['name'] == 'First result'
    assert client.delete(f'/api/experiments/{eid}').status_code == 200
    assert client.get('/api/experiments').json() == []


def test_ownership_isolation(client):
    client.post('/api/auth/register', json=DATA)
    eid = client.post('/api/experiments', json={'name': 'Private', 'config': CONFIG}).json()['id']
    client.post('/api/auth/logout')
    client.post('/api/auth/register', json={**DATA, 'email': 'other@example.com'})
    assert client.get('/api/experiments').json() == []
    assert client.get(f'/api/experiments/{eid}').status_code == 404
    assert client.delete(f'/api/experiments/{eid}').status_code == 404


def test_csrf_expiry_duplicates_and_rate_limits(client):
    assert client.post('/api/auth/register', json=DATA, headers={'Origin': 'https://evil.example'}).status_code == 403
    assert client.post('/api/auth/register', json=DATA).status_code == 201
    assert client.post('/api/auth/register', json=DATA).status_code == 409
    with sqlite3.connect(main.DB) as conn:
        conn.execute('UPDATE sessions SET expires=0')
    assert client.get('/api/auth/me').status_code == 401
    with main.lock:
        main.limits[('testclient', 'auth')] = [main.time.time()] * 30
    assert client.post('/api/auth/login', json=DATA).status_code == 429
