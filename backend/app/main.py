import hashlib
import json
import os
import secrets
import sqlite3
import threading
import time
from contextlib import asynccontextmanager, contextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from .model import Experiment, MemoryModel

DB = Path(os.getenv('DATABASE_PATH', 'data/trace.db'))
ORIGINS = os.getenv('ALLOWED_ORIGINS', 'http://localhost:8080,http://localhost:5173,http://127.0.0.1:5173').split(',')
COOKIE_SECURE = os.getenv('COOKIE_SECURE', 'false').lower() == 'true'
model = None
limits = {}
lock = threading.Lock()


@contextmanager
def connection():
    conn = sqlite3.connect(DB, timeout=15)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys=ON')
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@asynccontextmanager
async def lifespan(app):
    global model
    DB.parent.mkdir(parents=True, exist_ok=True)
    with connection() as c:
        c.executescript('''
        PRAGMA journal_mode=WAL;
        CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, expires REAL NOT NULL);
        CREATE TABLE IF NOT EXISTS experiments(id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, config TEXT NOT NULL, result TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS progress(user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, completed TEXT NOT NULL);
        ''')
    model = MemoryModel()
    yield


app = FastAPI(title='TRACE Memory Lab', version='1.0.0', lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=ORIGINS, allow_credentials=True,
                   allow_methods=['GET', 'POST', 'PUT', 'DELETE'], allow_headers=['Content-Type'])


@app.middleware('http')
async def protect(request: Request, call_next):
    origin = request.headers.get('origin')
    if request.method in {'POST', 'PUT', 'DELETE'} and origin and origin not in ORIGINS:
        return Response('Origin not allowed', status_code=403)
    if int(request.headers.get('content-length', '0') or '0') > 65536:
        return Response('Request too large', status_code=413)
    response = await call_next(request)
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Cache-Control'] = 'no-store'
    return response


def throttle(request: Request, group='auth', maximum=30):
    key = (request.client.host if request.client else 'unknown', group)
    now = time.time()
    with lock:
        if len(limits) > 10000:
            limits.clear()
        hits = [t for t in limits.get(key, []) if now - t < 60]
        if len(hits) >= maximum:
            raise HTTPException(429, 'Too many requests. Try again in a minute.')
        limits[key] = hits + [now]


class Credentials(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=10, max_length=128)
    name: str = Field(default='Explorer', min_length=1, max_length=60)

    @field_validator('email')
    @classmethod
    def email_valid(cls, value):
        value = value.strip().lower()
        if len(value.split('@')) != 2 or '.' not in value.split('@')[-1] or any(c.isspace() for c in value):
            raise ValueError('Enter a valid email address')
        return value


def password_hash(password, salt=None):
    salt = salt or secrets.token_hex(16)
    hashed = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=16384, r=8, p=1).hex()
    return salt + ':' + hashed


def user(request: Request):
    token = request.cookies.get('trace_session', '')
    digest = hashlib.sha256(token.encode()).hexdigest()
    with connection() as c:
        row = c.execute('SELECT users.id,name,email FROM users JOIN sessions ON users.id=sessions.user_id WHERE token=? AND expires>?', (digest, time.time())).fetchone()
    if not row:
        raise HTTPException(401, 'Sign in to save and revisit your experiments.')
    return dict(row)


def issue_session(uid, response):
    token = secrets.token_urlsafe(32)
    with connection() as c:
        c.execute('DELETE FROM sessions WHERE expires < ?', (time.time(),))
        c.execute('INSERT INTO sessions VALUES(?,?,?)', (hashlib.sha256(token.encode()).hexdigest(), uid, time.time() + 604800))
    response.set_cookie('trace_session', token, httponly=True, secure=COOKIE_SECURE, samesite='strict', max_age=604800)


@app.get('/api/health')
def health():
    with connection() as c:
        c.execute('SELECT 1').fetchone()
    return {'status': 'ok', 'database': 'sqlite', 'model': model.metrics['version']}


@app.post('/api/auth/register', status_code=201)
def register(data: Credentials, request: Request, response: Response):
    throttle(request)
    hashed = password_hash(data.password)
    try:
        with connection() as c:
            uid = c.execute('INSERT INTO users(name,email,password) VALUES(?,?,?)', (data.name.strip() or 'Explorer', data.email, hashed)).lastrowid
    except sqlite3.IntegrityError:
        raise HTTPException(409, 'An account with this email already exists.')
    issue_session(uid, response)
    return {'id': uid, 'name': data.name.strip() or 'Explorer', 'email': data.email}


@app.post('/api/auth/login')
def login(data: Credentials, request: Request, response: Response):
    throttle(request)
    with connection() as c:
        row = c.execute('SELECT * FROM users WHERE email=?', (data.email,)).fetchone()
    # Perform the same expensive operation even when an account does not exist.
    stored = row['password'] if row else '00' * 16 + ':' + '00' * 64
    check = password_hash(data.password, stored.split(':')[0])
    if not secrets.compare_digest(stored, check):
        raise HTTPException(401, 'Email or password is incorrect.')
    issue_session(row['id'], response)
    return {k: row[k] for k in ['id', 'name', 'email']}


@app.get('/api/auth/me')
def me(current=Depends(user)):
    return current


@app.post('/api/auth/logout')
def logout(request: Request, response: Response):
    digest = hashlib.sha256(request.cookies.get('trace_session', '').encode()).hexdigest()
    with connection() as c:
        c.execute('DELETE FROM sessions WHERE token=?', (digest,))
    response.delete_cookie('trace_session', httponly=True, secure=COOKIE_SECURE, samesite='strict')
    return {'ok': True}


@app.get('/api/model')
def model_info():
    return model.metrics


@app.post('/api/experiments/run')
def run(data: Experiment, request: Request):
    throttle(request, 'run', 180)
    return model.run(data)


class Saved(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    config: Experiment


@app.post('/api/experiments', status_code=201)
def save(data: Saved, current=Depends(user)):
    result = model.run(data.config)
    with connection() as c:
        if c.execute('SELECT COUNT(*) FROM experiments WHERE user_id=?', (current['id'],)).fetchone()[0] >= 200:
            raise HTTPException(409, 'Your notebook holds 200 experiments. Delete an older one to make room.')
        eid = c.execute('INSERT INTO experiments(user_id,name,config,result) VALUES(?,?,?,?)',
                        (current['id'], data.name, data.config.model_dump_json(), json.dumps(result))).lastrowid
    return {'id': eid}


@app.get('/api/experiments')
def experiments(current=Depends(user)):
    with connection() as c:
        rows = c.execute('SELECT id,name,config,created_at FROM experiments WHERE user_id=? ORDER BY id DESC', (current['id'],)).fetchall()
    return [{**dict(row), 'config': json.loads(row['config'])} for row in rows]


@app.get('/api/experiments/{eid}')
def experiment(eid: int, current=Depends(user)):
    with connection() as c:
        row = c.execute('SELECT * FROM experiments WHERE id=? AND user_id=?', (eid, current['id'])).fetchone()
    if not row:
        raise HTTPException(404, 'Experiment not found')
    return {'id': row['id'], 'name': row['name'], 'config': json.loads(row['config']), 'result': json.loads(row['result'])}


@app.delete('/api/experiments/{eid}')
def delete(eid: int, current=Depends(user)):
    with connection() as c:
        if not c.execute('DELETE FROM experiments WHERE id=? AND user_id=?', (eid, current['id'])).rowcount:
            raise HTTPException(404, 'Experiment not found')
    return {'ok': True}


class Progress(BaseModel):
    completed: list[int] = Field(max_length=4)

    @field_validator('completed')
    @classmethod
    def valid_steps(cls, value):
        if any(i not in range(4) for i in value):
            raise ValueError('Unknown lesson')
        return sorted(set(value))


@app.get('/api/progress')
def get_progress(current=Depends(user)):
    with connection() as c:
        row = c.execute('SELECT completed FROM progress WHERE user_id=?', (current['id'],)).fetchone()
    return {'completed': json.loads(row[0]) if row else []}


@app.put('/api/progress')
def set_progress(data: Progress, current=Depends(user)):
    with connection() as c:
        c.execute('INSERT INTO progress VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET completed=excluded.completed', (current['id'], json.dumps(data.completed)))
    return data
