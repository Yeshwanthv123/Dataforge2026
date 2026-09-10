"""Build the no-sign-in artifact. Python 3.12+, Node 22+, npm required.

The GitHub Pages artifact runs the unchanged model.py through pinned Pyodide.
Run from any directory: python scripts/build_public.py
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.runtime-cache'
OUT = ROOT / '.public-build'
LOCK = ROOT / 'docs' / 'PUBLIC_RUNTIME_LOCK.json'
CDN = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/'

def fetch(url):
    with urllib.request.urlopen(url, timeout=90) as r:
        return r.read()

def initialize_lock():
    """Maintainer-only dependency update. Ordinary builds verify committed hashes."""
    CACHE.mkdir(exist_ok=True)
    raw = fetch(CDN + 'pyodide-lock.json')
    manifest = json.loads(raw)
    packages = manifest['packages']
    names = {'pyodide.js', 'pyodide.mjs', 'pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json'}
    selected = {}
    def add(name):
        key = name.lower().replace('_', '-')
        if key in selected: return
        selected[key] = packages[key]
        names.add(packages[key]['file_name'])
        for dep in packages[key]['depends']: add(dep)
    for name in ['numpy', 'pydantic']: add(name)
    expected = {v['file_name']: v['sha256'] for v in selected.values()}
    files = []
    for name in sorted(names):
        print('Pinning', name, flush=True)
        payload = raw if name == 'pyodide-lock.json' else fetch(CDN + name)
        digest = hashlib.sha256(payload).hexdigest()
        if name in expected and digest != expected[name]: raise RuntimeError('Upstream package checksum mismatch: ' + name)
        (CACHE / name).write_bytes(payload)
        files.append({'name': name, 'url': CDN + name, 'sha256': digest, 'bytes': len(payload)})
    LOCK.write_text(json.dumps({'pyodide_version': '0.27.7', 'python': manifest['info']['python'], 'packages': selected, 'files': files}, indent=2)+'\n', encoding='utf-8')

def build():
    spec = json.loads(LOCK.read_text(encoding='utf-8'))
    CACHE.mkdir(exist_ok=True)
    for item in spec['files']:
        dest = CACHE / item['name']
        if not dest.exists():
            print('Downloading', item['name'], flush=True)
            dest.write_bytes(fetch(item['url']))
        if hashlib.sha256(dest.read_bytes()).hexdigest() != item['sha256']:
            raise RuntimeError('Runtime checksum mismatch. Remove and re-download: ' + str(dest))
    npm = shutil.which('npm.cmd' if os.name == 'nt' else 'npm')
    if not npm: raise RuntimeError('Install Node.js 22+ including npm.')
    if OUT.exists():
        if OUT.resolve() != ROOT.resolve()/'.public-build' or OUT.is_symlink():
            raise RuntimeError('Unexpected output path; refusing to remove it.')
        shutil.rmtree(OUT)
    env = {**os.environ, 'VITE_PUBLIC_DEMO': 'true', 'VITE_BASE_PATH': '/Dataforge2026/'}
    subprocess.run([npm, 'run', 'build', '--', '--mode', 'public', '--outDir', str(OUT)], cwd=ROOT/'frontend', env=env, check=True)
    for item in spec['files']:
        target = OUT/'runtime'/item['name']; target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(CACHE/item['name'], target)
    for name in ['model.py']:
        (OUT/'python').mkdir(exist_ok=True)
        shutil.copy2(ROOT/'backend/app'/name, OUT/'python'/name)
    (OUT/'python/artifacts').mkdir(parents=True, exist_ok=True)
    for name in ['decoder.npz','metrics.json']:
        shutil.copy2(ROOT/'backend/artifacts'/name, OUT/'python/artifacts'/name)
    (OUT/'submission').mkdir(exist_ok=True)
    for name in ['CONCEPT_SUMMARY.pdf','TECHNICAL_BLOG.pdf','THIRD_PARTY.md','AI_DISCLOSURE.md','RESEARCH.md','MODEL_CARD.md','PUBLIC_RUNTIME_LOCK.json','DEPENDENCIES.json','ASSET_REGISTER.json','PUBLIC_DEPLOYMENT.md','VALIDATION.md']:
        if (ROOT/'docs'/name).exists(): shutil.copy2(ROOT/'docs'/name, OUT/'submission'/name)
    shutil.copy2(ROOT/'README.md',OUT/'submission/README.md')
    if (ROOT/'output/Cyber_Leek_TRACE.pptx').exists(): shutil.copy2(ROOT/'output/Cyber_Leek_TRACE.pptx',OUT/'submission/Cyber_Leek_TRACE.pptx')
    if (ROOT/'docs/submission-index.html').exists(): shutil.copy2(ROOT/'docs/submission-index.html',OUT/'submission/index.html')
    if (ROOT/'licenses').exists(): shutil.copytree(ROOT/'licenses',OUT/'licenses',dirs_exist_ok=True)
    shutil.copy2(ROOT/'LICENSE',OUT/'LICENSE')
    (OUT/'.nojekyll').write_text('',encoding='utf-8')
    print('Public artifact ready:', OUT)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--initialize-runtime-lock', action='store_true')
    args = parser.parse_args()
    if args.initialize_runtime_lock: initialize_lock()
    build()
