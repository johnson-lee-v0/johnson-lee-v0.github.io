#!/usr/bin/env python3
"""Local-only portfolio preview, optionally mounting the PUBLIC research build.

python tools/preview.py --port 4176 --research-demo /path/to/frontend/dist/demo
Do not pass frontend/dist: that is the separate private application build.
No files are copied, generated, or published by this server.
"""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

MOUNT = "/Equity-Research"
ROOT = Path(__file__).resolve().parents[1]


def resolve_asset(url, website, research_demo):
    """Resolve within exactly one public root; never traverse or follow symlinks."""
    pathname = unquote(urlsplit(url).path)
    is_research = pathname == MOUNT or pathname.startswith(MOUNT + "/")
    root = research_demo if is_research else website
    if root is None:
        return None
    relative = pathname[len(MOUNT):] if is_research else pathname
    parts = [part for part in relative.split("/") if part]
    if any(part.startswith(".") or "\\" in part or "\0" in part for part in parts):
        return None
    root = Path(root).resolve()
    candidate = root
    for part in parts:
        candidate = candidate / part
        if candidate.is_symlink():
            return None
    if not candidate.resolve().is_relative_to(root):
        return None
    return candidate


class PreviewHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, website=ROOT, research_demo=None, **kwargs):
        self.website = Path(website).resolve()
        self.research_demo = Path(research_demo).resolve() if research_demo else None
        super().__init__(*args, directory=str(self.website), **kwargs)

    def translate_path(self, path):
        asset = resolve_asset(path, self.website, self.research_demo)
        return str(asset) if asset else str(self.website / ".preview-unavailable")

    def send_head(self):
        asset = resolve_asset(self.path, self.website, self.research_demo)
        if asset is None or (asset.is_dir() and any((asset / name).is_symlink() for name in ("index.html", "index.htm"))):
            self.send_error(404, "Preview asset unavailable")
            return None
        return super().send_head()

    def list_directory(self, path):
        self.send_error(404, "Directory listing is disabled")
        return None

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=4176)
    parser.add_argument("--research-demo", type=Path, help="Verified frontend/dist/demo directory only")
    args = parser.parse_args()
    if args.research_demo:
        public = args.research_demo.resolve()
        required = ("index.html", "LICENSE.txt", "THIRD_PARTY_NOTICES.txt")
        if not all((public / name).is_file() for name in required):
            parser.error("The research path must be the verified PUBLIC demo build, including its license notices.")
    handler = partial(PreviewHandler, research_demo=args.research_demo)
    with ThreadingHTTPServer(("127.0.0.1", args.port), handler) as server:
        print(f"Portfolio preview: http://127.0.0.1:{args.port}/", flush=True)
        if args.research_demo:
            print(f"Public research preview: http://127.0.0.1:{args.port}{MOUNT}/", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
