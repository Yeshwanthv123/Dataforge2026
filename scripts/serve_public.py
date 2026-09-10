"""Serve the built public artifact under the exact GitHub Pages base path."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(302); self.send_header('Location', '/Dataforge2026/'); self.end_headers(); return
        if not self.path.startswith('/Dataforge2026/'):
            self.send_error(404); return
        self.path = self.path[len('/Dataforge2026'):]
        super().do_GET()

if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--directory', default=str(ROOT/'.public-build'))
    p.add_argument('--port', type=int, default=8090)
    args = p.parse_args()
    folder = Path(args.directory).resolve()
    if not (folder/'index.html').is_file(): raise SystemExit('Build first, or specify the public-artifact directory.')
    print(f'Open http://localhost:{args.port}/Dataforge2026/', flush=True)
    ThreadingHTTPServer(('127.0.0.1', args.port), partial(Handler, directory=str(folder))).serve_forever()
