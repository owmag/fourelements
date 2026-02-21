#!/usr/bin/env python3
"""Serve the built React app on localhost:5555 for testing."""

import http.server
import socketserver
import os
import subprocess
import sys

PORT = 5555
DIST_DIR = "dist"


def main():
    root = os.path.dirname(os.path.abspath(__file__))
    dist_path = os.path.join(root, DIST_DIR)
    if not os.path.exists(dist_path):
        print("Building React app first...")
        result = subprocess.run(["npm", "run", "build"], cwd=root)
        if result.returncode != 0:
            print("Build failed. Run 'npm run build' manually.")
            sys.exit(1)

    os.chdir(dist_path)
    handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"Serving at http://localhost:{PORT}")
        print("Press Ctrl+C to stop")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
