"""Package committed project files plus the built public artifact, with hashes."""
import hashlib
import json
from pathlib import Path
import subprocess
import zipfile

ROOT=Path(__file__).resolve().parents[1]
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT)
if git('status','--porcelain').strip():raise SystemExit('Commit source changes before packaging.')
commit=git('rev-parse','HEAD').decode().strip()
paths=[p for p in git('ls-files','-z').decode().split('\0') if p]
files={p:(ROOT/p).read_bytes() for p in paths}
for p in paths:
    if any(part in ['node_modules','.venv','tmp','.git','data'] for part in Path(p).parts) or p.endswith(('.db','.db-wal','.db-shm')):
        raise SystemExit('Private/generated path unexpectedly tracked: '+p)
public=ROOT/'.public-build'
if not (public/'index.html').exists():raise SystemExit('Run scripts/build_public.py first.')
for f in sorted(public.rglob('*')):
    if f.is_file(): files['public-artifact/'+f.relative_to(public).as_posix()]=f.read_bytes()
files['SOURCE_COMMIT.txt']=(commit+'\n').encode()
manifest={'source_commit':commit,'repository':'https://github.com/Yeshwanthv123/Dataforge2026','public_artifact':'https://yeshwanthv123.github.io/Dataforge2026/','files':[{'path':p,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()} for p,data in sorted(files.items())]}
files['MANIFEST.json']=(json.dumps(manifest,indent=2)+'\n').encode()
out=ROOT/'release';out.mkdir(exist_ok=True)
dest=out/'Cyber_Leek_TRACE_Submission.zip'
with zipfile.ZipFile(dest,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
    for p,data in sorted(files.items()):
        info=zipfile.ZipInfo(p,date_time=(2026,9,10,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED
        z.writestr(info,data)
with zipfile.ZipFile(dest) as z:
    assert z.testzip() is None
    for item in manifest['files']:
        assert hashlib.sha256(z.read(item['path'])).hexdigest()==item['sha256']
digest=hashlib.sha256(dest.read_bytes()).hexdigest()
(out/'SHA256SUMS.txt').write_text(digest+'  '+dest.name+'\n',encoding='utf-8')
print(json.dumps({'zip':str(dest),'bytes':dest.stat().st_size,'files':len(files),'sha256':digest,'source_commit':commit},indent=2))
