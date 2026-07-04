# Claude Code Portable

*English · [中文](README_zh.md)*

> Portable packaging of [Claude Code](https://claude.ai/code) — extract and run, no installation required.

[Claude Code](https://claude.ai/code) is Anthropic's official CLI. This repository automatically repackages the official binary into self-contained archives for deployment on **air-gapped or proxy-only servers** where package managers and internet access are unavailable.

**Current release: [v2.1.201](https://github.com/HansBug/claude-portable/releases/tag/v2.1.201)** · [All releases](https://github.com/HansBug/claude-portable/releases)

## Download

| Platform | File | SHA256 |
|----------|------|--------|
| Linux x86-64 (glibc)<br><small>Ubuntu 20.04+, Debian 10+, CentOS 7+</small> | [claude-portable-linux-x64-v2.1.201.tar.gz](https://github.com/HansBug/claude-portable/releases/download/v2.1.201/claude-portable-linux-x64-v2.1.201.tar.gz) | [checksum](https://github.com/HansBug/claude-portable/releases/download/v2.1.201/claude-portable-linux-x64-v2.1.201.tar.gz.sha256) |
| Linux ARM64 (glibc)<br><small>Ubuntu 20.04 ARM+</small> | [claude-portable-linux-arm64-v2.1.201.tar.gz](https://github.com/HansBug/claude-portable/releases/download/v2.1.201/claude-portable-linux-arm64-v2.1.201.tar.gz) | [checksum](https://github.com/HansBug/claude-portable/releases/download/v2.1.201/claude-portable-linux-arm64-v2.1.201.tar.gz.sha256) |
| Linux x86-64 (musl)<br><small>Alpine 3.19+</small> | [claude-portable-linux-x64-musl-v2.1.201.tar.gz](https://github.com/HansBug/claude-portable/releases/download/v2.1.201/claude-portable-linux-x64-musl-v2.1.201.tar.gz) | [checksum](https://github.com/HansBug/claude-portable/releases/download/v2.1.201/claude-portable-linux-x64-musl-v2.1.201.tar.gz.sha256) |
| Linux ARM64 (musl)<br><small>Alpine ARM</small> | [claude-portable-linux-arm64-musl-v2.1.201.tar.gz](https://github.com/HansBug/claude-portable/releases/download/v2.1.201/claude-portable-linux-arm64-musl-v2.1.201.tar.gz) | [checksum](https://github.com/HansBug/claude-portable/releases/download/v2.1.201/claude-portable-linux-arm64-musl-v2.1.201.tar.gz.sha256) |
| macOS Apple Silicon<br><small>M1/M2/M3, macOS 13+</small> | [claude-portable-darwin-arm64-v2.1.201.tar.gz](https://github.com/HansBug/claude-portable/releases/download/v2.1.201/claude-portable-darwin-arm64-v2.1.201.tar.gz) | [checksum](https://github.com/HansBug/claude-portable/releases/download/v2.1.201/claude-portable-darwin-arm64-v2.1.201.tar.gz.sha256) |
| macOS Intel<br><small>Intel, macOS 13+</small> | [claude-portable-darwin-x64-v2.1.201.tar.gz](https://github.com/HansBug/claude-portable/releases/download/v2.1.201/claude-portable-darwin-x64-v2.1.201.tar.gz) | [checksum](https://github.com/HansBug/claude-portable/releases/download/v2.1.201/claude-portable-darwin-x64-v2.1.201.tar.gz.sha256) |
| Windows x86-64<br><small>Windows 10+</small> | [claude-portable-win32-x64-v2.1.201.zip](https://github.com/HansBug/claude-portable/releases/download/v2.1.201/claude-portable-win32-x64-v2.1.201.zip) | [checksum](https://github.com/HansBug/claude-portable/releases/download/v2.1.201/claude-portable-win32-x64-v2.1.201.zip.sha256) |
| Windows ARM64<br><small>Windows 11 ARM</small> | [claude-portable-win32-arm64-v2.1.201.zip](https://github.com/HansBug/claude-portable/releases/download/v2.1.201/claude-portable-win32-arm64-v2.1.201.zip) | [checksum](https://github.com/HansBug/claude-portable/releases/download/v2.1.201/claude-portable-win32-arm64-v2.1.201.zip.sha256) |


## Quick Install

### Linux / macOS — one-liner

```bash
# Linux x86-64 (glibc) — change the filename for your platform
curl -fSLO https://github.com/HansBug/claude-portable/releases/download/v2.1.201/claude-portable-linux-x64-v2.1.201.tar.gz
tar xzf claude-portable-linux-x64-v2.1.201.tar.gz
cd claude-portable-linux-x64-v2.1.201   # strip .tar.gz
./claude --version
```

Move to `~/.local/bin` for a permanent install:

```bash
mkdir -p ~/.local/bin
cp claude bin/claude-real ~/.local/bin/  # copy both launcher and real binary
# Or keep the whole directory and symlink the launcher:
ln -sf "$PWD/claude" ~/.local/bin/claude
```

### Windows — PowerShell

```powershell
Invoke-WebRequest -Uri "https://github.com/HansBug/claude-portable/releases/download/v2.1.201/claude-portable-win32-x64-v2.1.201.zip" -OutFile "claude-portable-win32-x64-v2.1.201.zip"
Expand-Archive "claude-portable-win32-x64-v2.1.201.zip" .
.\claude-portable-win32-x64-v2.1.201\claude.cmd --version
```

## Configuration

### API Key

```bash
export ANTHROPIC_API_KEY=sk-ant-...
claude "Hello"
```

### Proxy (HTTP / HTTPS)

The launcher passes all proxy environment variables through to Claude Code:

```bash
export HTTPS_PROXY=http://proxy.corp.example.com:8080
export HTTP_PROXY=http://proxy.corp.example.com:8080
export NO_PROXY=localhost,127.0.0.1,10.0.0.0/8

# Corporate CA cert (if your proxy does TLS inspection)
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/corp-ca.pem

claude --version
```

### Custom API Endpoint

```bash
# Route through an internal LLM gateway instead of api.anthropic.com
export ANTHROPIC_BASE_URL=https://your-internal-gateway/
```

## Supported Platforms

| Platform | Notes |
|----------|-------|
| **Linux x86-64 (glibc)** | Ubuntu 20.04+, Debian 10+, CentOS 7+ |
| **Linux ARM64 (glibc)** | Ubuntu 20.04 ARM+ |
| **Linux x86-64 (musl)** | Alpine 3.19+ |
| **Linux ARM64 (musl)** | Alpine ARM |
| **macOS Apple Silicon** | M1/M2/M3, macOS 13+ |
| **macOS Intel** | Intel, macOS 13+ |
| **Windows x86-64** | Windows 10+ |
| **Windows ARM64** | Windows 11 ARM |


> **`DISABLE_AUTOUPDATER=1`** is injected automatically by the launcher script.
> The binary will never attempt to download updates, making it safe for air-gapped environments.

## Bundle Layout

```
claude-portable-<platform>-v2.1.201/
├── claude          ← launcher (sets DISABLE_AUTOUPDATER=1, then execs the real binary)
├── bin/
│   └── claude-real ← the official Anthropic binary (~227 MB, self-contained)
└── portable-metadata.json
```

On Windows: `claude.cmd` (CMD) and `claude.ps1` (PowerShell) replace the Unix `claude` launcher.

## How It Works

1. GitHub Actions polls npm every 3 hours for a new `@anthropic-ai/claude-code` release.
2. When a new version is found, release notes are generated with Claude (claude-opus-4-7) and a GitHub Release is created.
3. Eight parallel build jobs extract the official binary for each platform, wrap it with a launcher script, and package the result.
4. Smoke tests run on every platform before artifacts are published.
5. This README is regenerated automatically from the release metadata.

## License

The Claude Code binary is distributed by Anthropic under their [Terms of Service](https://www.anthropic.com/legal/consumer-terms).
The launcher scripts and packaging tooling in this repository are MIT licensed.
