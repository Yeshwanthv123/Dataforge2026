"""Collect installed dependency notices and a reproducible source inventory."""
import hashlib
import importlib.metadata as md
import json
from pathlib import Path
import re
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT/'licenses'
records = []
def safe(s): return re.sub(r'[^a-zA-Z0-9._-]', '_', s)
def put(path, data):
    path.parent.mkdir(parents=True, exist_ok=True); path.write_bytes(data)
def notice(name): return any(s in name.lower() for s in ('license','licence','notice','copying','copyright'))

lock = json.loads((ROOT/'frontend/package-lock.json').read_text())
for path, pkg in lock['packages'].items():
    if not path: continue
    name = path.rsplit('node_modules/',1)[-1]
    home = ROOT/'frontend'/path
    row = dict(ecosystem='npm',name=name,version=pkg['version'],license=pkg.get('license','See upstream notices'),source=pkg.get('resolved'),integrity=pkg.get('integrity'),notices=[])
    if home.is_dir():
        for file in home.iterdir():
            if file.is_file() and notice(file.name):
                dest=OUT/'npm'/safe(name)/file.name; put(dest,file.read_bytes()); row['notices'].append(dest.relative_to(ROOT).as_posix())
    records.append(row)

for dist in md.distributions(path=[str(ROOT/'.venv/Lib/site-packages')]):
    name=dist.metadata['Name']; version=dist.version
    row=dict(ecosystem='python-local',name=name,version=version,license=dist.metadata.get('License-Expression') or dist.metadata.get('License') or '; '.join(dist.metadata.get_all('Classifier',[]) if False else [v for v in dist.metadata.get_all('Classifier',[]) if v.startswith('License ::')]),source=f'https://pypi.org/project/{name}/{version}/',notices=[])
    for file in dist.files or []:
        if notice(str(file)) and '.dist-info/' in str(file):
            source=dist.locate_file(file)
            if source.is_file():
                dest=OUT/'python'/safe(name)/Path(str(file)).name; put(dest,source.read_bytes()); row['notices'].append(dest.relative_to(ROOT).as_posix())
    records.append(row)

spec=json.loads((ROOT/'docs/PUBLIC_RUNTIME_LOCK.json').read_text())
for name, pkg in spec['packages'].items():
    row=dict(ecosystem='pyodide',name=name,version=pkg['version'],source='https://cdn.jsdelivr.net/pyodide/v0.27.7/full/'+pkg['file_name'],sha256=pkg['sha256'],notices=[])
    with zipfile.ZipFile(ROOT/'.runtime-cache'/pkg['file_name']) as z:
        for file in z.namelist():
            if notice(file) and not file.endswith('/'):
                dest=OUT/'public-runtime'/safe(name)/safe(file);put(dest,z.read(file));row['notices'].append(dest.relative_to(ROOT).as_posix())
        metas=[f for f in z.namelist() if f.endswith('.dist-info/METADATA')]
        if metas:
            from email.parser import Parser
            m=Parser().parsestr(z.read(metas[0]).decode())
            row['license']=m.get('License-Expression') or m.get('License') or '; '.join(v for v in m.get_all('Classifier',[]) if v.startswith('License ::'))
    records.append(row)

upstream = {
    'pyodide-MPL-2.0.txt':'https://raw.githubusercontent.com/pyodide/pyodide/0.27.7/LICENSE',
    'CPython-3.12.7-LICENSE.txt':'https://raw.githubusercontent.com/python/cpython/v3.12.7/LICENSE',
    'emscripten-LICENSE.txt':'https://raw.githubusercontent.com/emscripten-core/emscripten/3.1.58/LICENSE',
    'Node-22-LICENSE.txt':'https://raw.githubusercontent.com/nodejs/node/v22.19.0/LICENSE',
    'nginx-1.28.0-LICENSE.txt':'https://raw.githubusercontent.com/nginx/nginx/release-1.28.0/LICENSE',
}
for name,url in upstream.items():
    dest=OUT/'runtimes'/name
    if not dest.exists(): put(dest,urllib.request.urlopen(url,timeout=60).read())
    records.append(dict(ecosystem='runtime-notice',name=name,source=url,sha256=hashlib.sha256(dest.read_bytes()).hexdigest(),notices=[dest.relative_to(ROOT).as_posix()]))
(ROOT/'docs/DEPENDENCIES.json').write_text(json.dumps(records,indent=2)+'\n',encoding='utf-8')
assets=[]
for path,source in [('output/pitch-assets/cover-memory.png','OpenAI image generation; conceptual synaptic-memory artwork, gold on dark background'),('output/pitch-assets/architecture.png','OpenAI image generation; Docker frontend/API/model/SQLite architecture illustration'),('output/pitch-assets/prototype.png','User-provided screenshot of TRACE running locally'),('frontend/public/favicon.svg','Original TRACE geometric brand SVG, AI-assisted'),('backend/artifacts/decoder.npz','Original model.py, seed 42, trained synthetic symbol decoder'),('backend/artifacts/synthetic_dataset.npz','Original model.py, seed 42, independent train/test vectors')]:
    f=ROOT/path
    assets.append(dict(path=path,source=source,license='Project MIT to extent applicable rights; see AI_DISCLOSURE.md',sha256=hashlib.sha256(f.read_bytes()).hexdigest()))
(ROOT/'docs/ASSET_REGISTER.json').write_text(json.dumps(assets,indent=2)+'\n',encoding='utf-8')
print('Recorded',len(records),'dependencies/notices and',len(assets),'assets')
