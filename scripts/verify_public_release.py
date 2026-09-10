"""Verify every built public file anonymously against its local SHA-256."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib, json, subprocess, urllib.request
from pathlib import Path
from urllib.parse import quote
ROOT=Path(__file__).resolve().parents[1]
BASE='https://yeshwanthv123.github.io/Dataforge2026/'
def check(path):
    relative=path.relative_to(ROOT/'.public-build').as_posix()
    with urllib.request.urlopen(BASE+quote(relative),timeout=90) as response:
        data=response.read();code=response.status
    expected=hashlib.sha256(path.read_bytes()).hexdigest()
    assert code==200 and hashlib.sha256(data).hexdigest()==expected, relative
    return {'path':relative,'http_status':code,'sha256':expected}
files=[p for p in (ROOT/'.public-build').rglob('*') if p.is_file() and not p.name.startswith('.')]
with ThreadPoolExecutor(max_workers=6) as pool: results=list(pool.map(check,files))
repo=json.load(urllib.request.urlopen('https://api.github.com/repos/Yeshwanthv123/Dataforge2026',timeout=30))
assert repo['private'] is False
report={'checked_at_utc':datetime.now(timezone.utc).isoformat(),'artifact_url':BASE,'repository':repo['html_url'],'repository_public':True,'authentication_used':False,'source_commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'files_checked':len(results),'status':'passed','files':sorted(results,key=lambda x:x['path'])}
(ROOT/'docs/RELEASE_VERIFICATION.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='files'},indent=2))
