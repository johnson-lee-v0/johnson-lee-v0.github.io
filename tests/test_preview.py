"""Run with python -m unittest discover -s tests -p 'test_preview.py'."""
import importlib.util
from contextlib import closing
from functools import partial
from http.client import HTTPConnection
from http.server import ThreadingHTTPServer
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Thread
import unittest

spec = importlib.util.spec_from_file_location("preview", Path(__file__).resolve().parents[1] / "tools/preview.py")
preview = importlib.util.module_from_spec(spec)
spec.loader.exec_module(preview)


class PreviewTests(unittest.TestCase):
    def setUp(self):
        self.temp = TemporaryDirectory()
        root = Path(self.temp.name)
        self.site = root / "site"
        self.demo = root / "public-demo"
        self.site.mkdir()
        self.demo.mkdir()
        (self.site / "index.html").write_text("portfolio")
        (self.demo / "index.html").write_text("acknowledged META demo")
        (self.demo / "assets").mkdir()
        (self.demo / "assets/app.js").write_text("public static code")
        (self.site / "escape").symlink_to(self.demo, target_is_directory=True)
        (self.site / "linked-index").mkdir()
        (self.site / "linked-index/index.html").symlink_to(self.demo / "index.html")
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), partial(preview.PreviewHandler, website=self.site, research_demo=self.demo))
        self.thread = Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()
        self.temp.cleanup()

    def get(self, path):
        with closing(HTTPConnection("127.0.0.1", self.server.server_port)) as connection:
            connection.request("GET", path)
            response = connection.getresponse()
            return response.status, dict(response.getheaders()), response.read().decode()

    def test_public_mount_and_assets(self):
        self.assertEqual(self.get("/")[2], "portfolio")
        status, headers, body = self.get("/Equity-Research/?preview=1")
        self.assertEqual((status, body), (200, "acknowledged META demo"))
        self.assertEqual(headers["Cache-Control"], "no-store")
        self.assertEqual(self.get("/Equity-Research/assets/app.js")[2], "public static code")
        status, headers, _ = self.get("/Equity-Research")
        self.assertEqual((status, headers["Location"]), (301, "/Equity-Research/"))

    def test_no_private_paths_or_directory_listings(self):
        for path in ["/.git/config", "/Equity-Research/%2e%2e/index.html", "/Equity-Research/%2f..%2findex.html", "/escape/index.html", "/linked-index/", "/Equity-Research/assets/", "/Equity-Researchish/index.html"]:
            with self.subTest(path=path):
                self.assertEqual(self.get(path)[0], 404)
        self.assertIsNone(preview.resolve_asset("/Equity-Research/", self.site, None))


if __name__ == "__main__":
    unittest.main()
