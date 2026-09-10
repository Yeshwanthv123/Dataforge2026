// Numerical parity check, no browser automation. Build public artifact first.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cases=[];
for (const rule of ['hebbian','delta']) for (const overlap of [0,.35,1]) for (const retention of [1,.6]) {
  cases.push({pairs:[{key:0,value:0},{key:0,value:0},{key:0,value:2},{key:1,value:4}],query:0,rule,overlap,retention,noise:.13,seed:42,strength:.8});
}
const python = process.argv[2] || 'python';
const native = JSON.parse(execFileSync(python,['-c',"import sys,json;sys.path.insert(0,'backend');from app.model import MemoryModel,Experiment;m=MemoryModel();print(json.dumps([m.run(Experiment(**c)) for c in json.load(sys.stdin)]))"],{cwd:root,input:JSON.stringify(cases),encoding:'utf8'}));
const runtime=path.join(root,'.public-build/runtime');
const {loadPyodide}=await import(pathToFileURL(path.join(runtime,'pyodide.mjs')).href);
const py=await loadPyodide({indexURL:runtime+path.sep});
await py.loadPackage(['numpy','pydantic']);
py.FS.mkdirTree('/trace/app');py.FS.mkdirTree('/trace/artifacts');
for(const [src,dest] of [['backend/app/model.py','app/model.py'],['backend/artifacts/decoder.npz','artifacts/decoder.npz'],['backend/artifacts/metrics.json','artifacts/metrics.json']]) py.FS.writeFile('/trace/'+dest,fs.readFileSync(path.join(root,src)));
py.globals.set('cases_json',JSON.stringify(cases));
const wasm=JSON.parse(await py.runPythonAsync("import sys,json;sys.path.insert(0,'/trace/app');from model import MemoryModel,Experiment;m=MemoryModel();json.dumps([m.run(Experiment(**c)) for c in json.loads(cases_json)])"));
let maxDiff=0,numbers=0;
function compare(a,b,p='') {
 if(typeof a==='number' && typeof b==='number') { numbers++; maxDiff=Math.max(maxDiff,Math.abs(a-b));if(Math.abs(a-b)>1e-5)throw Error('Numerical mismatch '+p);return; }
 if(a && typeof a==='object'){if(JSON.stringify(Object.keys(a))!==JSON.stringify(Object.keys(b)))throw Error('Schema mismatch '+p);for(const k of Object.keys(a)){if(k!=='elapsed_ms')compare(a[k],b[k],p+'.'+k);}return;}
 if(a!==b)throw Error('Mismatch '+p);
}
compare(native,wasm);
const report={cases:cases.length,numeric_values_checked:numbers,max_absolute_difference:maxDiff,tolerance:1e-5,excluded_field:'elapsed_ms',model_sha256:native[0].model_sha256,public_runtime:'Pyodide 0.27.7',status:'passed'};
fs.writeFileSync(path.join(root,'docs/PARITY_CHECK.json'),JSON.stringify(report,null,2)+'\n');
console.log(report);
