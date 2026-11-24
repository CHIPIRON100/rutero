#!/usr/bin/env python3
"""Genera sw.js a partir de sw.src.js con la lista real de archivos.

Uso (opcional, solo si añades o quitas archivos): python3 build-sw.py
Si no tienes Python, edita la lista SHELL de sw.js a mano.
"""
import json
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
SKIP_DIRS = {".git", "docs", "tests"}
SKIP_FILES = {"sw.js", "sw.src.js", "build-sw.py", "README.md"}

files = []
for d, dirs, names in os.walk(ROOT):
    dirs[:] = [x for x in dirs if x not in SKIP_DIRS]
    for n in names:
        rel = os.path.relpath(os.path.join(d, n), ROOT).replace(os.sep, "/")
        if rel not in SKIP_FILES:
            files.append(rel)
files.sort()

version = "rutalibre-" + json.load(open(os.path.join(ROOT, "version.json")))["version"]
src = open(os.path.join(ROOT, "sw.src.js"), encoding="utf-8").read()
out = src.replace("__VERSION__", version).replace("__SHELL__", json.dumps(["./"] + files, indent=2))
open(os.path.join(ROOT, "sw.js"), "w", encoding="utf-8").write(out)
print(f"sw.js generado: {len(files)} archivos, versión {version}")
