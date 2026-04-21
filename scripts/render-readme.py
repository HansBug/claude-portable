#!/usr/bin/env python3
"""Render README templates using Jinja2 and actual release asset metadata."""
import argparse
import json
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, StrictUndefined

PLATFORMS = [
    {"id": "linux-x64",        "label": "Linux x86-64 (glibc)",  "archive": "tar.gz", "os": "Linux",   "note": "Ubuntu 20.04+, Debian 10+, CentOS 7+"},
    {"id": "linux-arm64",      "label": "Linux ARM64 (glibc)",    "archive": "tar.gz", "os": "Linux",   "note": "Ubuntu 20.04 ARM+"},
    {"id": "linux-x64-musl",   "label": "Linux x86-64 (musl)",    "archive": "tar.gz", "os": "Linux",   "note": "Alpine 3.19+"},
    {"id": "linux-arm64-musl", "label": "Linux ARM64 (musl)",     "archive": "tar.gz", "os": "Linux",   "note": "Alpine ARM"},
    {"id": "darwin-arm64",     "label": "macOS Apple Silicon",    "archive": "tar.gz", "os": "macOS",   "note": "M1/M2/M3, macOS 13+"},
    {"id": "darwin-x64",       "label": "macOS Intel",            "archive": "tar.gz", "os": "macOS",   "note": "Intel, macOS 13+"},
    {"id": "win32-x64",        "label": "Windows x86-64",         "archive": "zip",    "os": "Windows", "note": "Windows 10+"},
    {"id": "win32-arm64",      "label": "Windows ARM64",          "archive": "zip",    "os": "Windows", "note": "Windows 11 ARM"},
]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--release", required=True, help="Path to JSON from `gh release view --json`")
    parser.add_argument("--repo",    required=True, help="owner/repo")
    parser.add_argument("--output-en", required=True)
    parser.add_argument("--output-zh", required=True)
    args = parser.parse_args()

    with open(args.release) as f:
        release = json.load(f)

    tag     = release["tagName"]
    version = tag.lstrip("v")

    # Build name → downloadUrl map from release assets
    asset_urls = {a["name"]: a["url"] for a in release.get("assets", [])}

    def dl_url(filename):
        return asset_urls.get(
            filename,
            f"https://github.com/{args.repo}/releases/download/{tag}/{filename}",
        )

    platforms_ctx = []
    for p in PLATFORMS:
        fname     = f"claude-portable-{p['id']}-v{version}.{p['archive']}"
        sha_fname = fname + ".sha256"
        platforms_ctx.append({
            **p,
            "filename":   fname,
            "url":        dl_url(fname),
            "sha256_url": dl_url(sha_fname),
        })

    def plat(pid):
        return next(p for p in platforms_ctx if p["id"] == pid)

    ctx = {
        "repo":         args.repo,
        "version":      version,
        "tag":          tag,
        "release_url":  release.get("url", f"https://github.com/{args.repo}/releases/tag/{tag}"),
        "releases_url": f"https://github.com/{args.repo}/releases",
        "platforms":    platforms_ctx,
        "linux_x64":    plat("linux-x64"),
        "darwin_arm64": plat("darwin-arm64"),
        "win32_x64":    plat("win32-x64"),
    }

    templates_dir = Path(__file__).parent.parent / "templates"
    env = Environment(
        loader=FileSystemLoader(str(templates_dir)),
        undefined=StrictUndefined,
        keep_trailing_newline=True,
    )

    for tmpl_name, out_path in [
        ("README.md.j2",    args.output_en),
        ("README_zh.md.j2", args.output_zh),
    ]:
        rendered = env.get_template(tmpl_name).render(**ctx)
        Path(out_path).write_text(rendered, encoding="utf-8")
        print(f"Written: {out_path}")


if __name__ == "__main__":
    main()
