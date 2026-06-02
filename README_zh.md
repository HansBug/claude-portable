# Claude Code Portable

*[English](README.md) · 中文*

> [Claude Code](https://claude.ai/code) 的便携打包版本——解压即用，无需安装。

[Claude Code](https://claude.ai/code) 是 Anthropic 官方 CLI 工具。本仓库自动将官方二进制文件重新打包为自包含归档，适合在**无网络或仅代理上网的服务器**上部署，无需包管理器，无需联网安装。

**当前版本：[v2.1.160](https://github.com/HansBug/claude-portable/releases/tag/v2.1.160)** · [所有版本](https://github.com/HansBug/claude-portable/releases)

## 下载

| 平台 | 文件 | SHA256 |
|------|------|--------|
| Linux x86-64 (glibc)<br><small>Ubuntu 20.04+, Debian 10+, CentOS 7+</small> | [claude-portable-linux-x64-v2.1.160.tar.gz](https://github.com/HansBug/claude-portable/releases/download/v2.1.160/claude-portable-linux-x64-v2.1.160.tar.gz) | [校验值](https://github.com/HansBug/claude-portable/releases/download/v2.1.160/claude-portable-linux-x64-v2.1.160.tar.gz.sha256) |
| Linux ARM64 (glibc)<br><small>Ubuntu 20.04 ARM+</small> | [claude-portable-linux-arm64-v2.1.160.tar.gz](https://github.com/HansBug/claude-portable/releases/download/v2.1.160/claude-portable-linux-arm64-v2.1.160.tar.gz) | [校验值](https://github.com/HansBug/claude-portable/releases/download/v2.1.160/claude-portable-linux-arm64-v2.1.160.tar.gz.sha256) |
| Linux x86-64 (musl)<br><small>Alpine 3.19+</small> | [claude-portable-linux-x64-musl-v2.1.160.tar.gz](https://github.com/HansBug/claude-portable/releases/download/v2.1.160/claude-portable-linux-x64-musl-v2.1.160.tar.gz) | [校验值](https://github.com/HansBug/claude-portable/releases/download/v2.1.160/claude-portable-linux-x64-musl-v2.1.160.tar.gz.sha256) |
| Linux ARM64 (musl)<br><small>Alpine ARM</small> | [claude-portable-linux-arm64-musl-v2.1.160.tar.gz](https://github.com/HansBug/claude-portable/releases/download/v2.1.160/claude-portable-linux-arm64-musl-v2.1.160.tar.gz) | [校验值](https://github.com/HansBug/claude-portable/releases/download/v2.1.160/claude-portable-linux-arm64-musl-v2.1.160.tar.gz.sha256) |
| macOS Apple Silicon<br><small>M1/M2/M3, macOS 13+</small> | [claude-portable-darwin-arm64-v2.1.160.tar.gz](https://github.com/HansBug/claude-portable/releases/download/v2.1.160/claude-portable-darwin-arm64-v2.1.160.tar.gz) | [校验值](https://github.com/HansBug/claude-portable/releases/download/v2.1.160/claude-portable-darwin-arm64-v2.1.160.tar.gz.sha256) |
| macOS Intel<br><small>Intel, macOS 13+</small> | [claude-portable-darwin-x64-v2.1.160.tar.gz](https://github.com/HansBug/claude-portable/releases/download/v2.1.160/claude-portable-darwin-x64-v2.1.160.tar.gz) | [校验值](https://github.com/HansBug/claude-portable/releases/download/v2.1.160/claude-portable-darwin-x64-v2.1.160.tar.gz.sha256) |
| Windows x86-64<br><small>Windows 10+</small> | [claude-portable-win32-x64-v2.1.160.zip](https://github.com/HansBug/claude-portable/releases/download/v2.1.160/claude-portable-win32-x64-v2.1.160.zip) | [校验值](https://github.com/HansBug/claude-portable/releases/download/v2.1.160/claude-portable-win32-x64-v2.1.160.zip.sha256) |
| Windows ARM64<br><small>Windows 11 ARM</small> | [claude-portable-win32-arm64-v2.1.160.zip](https://github.com/HansBug/claude-portable/releases/download/v2.1.160/claude-portable-win32-arm64-v2.1.160.zip) | [校验值](https://github.com/HansBug/claude-portable/releases/download/v2.1.160/claude-portable-win32-arm64-v2.1.160.zip.sha256) |


## 快速安装

### Linux / macOS — 一行命令

```bash
# 以 Linux x86-64 (glibc) 为例，按实际平台替换文件名
curl -fSLO https://github.com/HansBug/claude-portable/releases/download/v2.1.160/claude-portable-linux-x64-v2.1.160.tar.gz
tar xzf claude-portable-linux-x64-v2.1.160.tar.gz
cd claude-portable-linux-x64-v2.1.160   # 去掉 .tar.gz 后缀
./claude --version
```

永久安装到 `~/.local/bin`：

```bash
mkdir -p ~/.local/bin
# 方式一：复制 launcher 和真实二进制
cp claude bin/claude-real ~/.local/bin/
# 方式二：保留目录，符号链接 launcher
ln -sf "$PWD/claude" ~/.local/bin/claude
```

### Windows — PowerShell

```powershell
Invoke-WebRequest -Uri "https://github.com/HansBug/claude-portable/releases/download/v2.1.160/claude-portable-win32-x64-v2.1.160.zip" -OutFile "claude-portable-win32-x64-v2.1.160.zip"
Expand-Archive "claude-portable-win32-x64-v2.1.160.zip" .
.\claude-portable-win32-x64-v2.1.160\claude.cmd --version
```

## 配置

### API Key

```bash
export ANTHROPIC_API_KEY=sk-ant-...
claude "你好"
```

### 代理设置（HTTP / HTTPS）

launcher 脚本会将所有代理环境变量透传给 Claude Code：

```bash
export HTTPS_PROXY=http://proxy.corp.example.com:8080
export HTTP_PROXY=http://proxy.corp.example.com:8080
export NO_PROXY=localhost,127.0.0.1,10.0.0.0/8

# 如果代理做了 TLS 拦截，需要提供企业 CA 证书
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/corp-ca.pem

claude --version
```

### 自定义 API Endpoint

```bash
# 通过内部 LLM 网关转发，而非直连 api.anthropic.com
export ANTHROPIC_BASE_URL=https://your-internal-gateway/
```

## 支持的平台

| 平台 | 系统要求 |
|------|---------|
| **Linux x86-64 (glibc)** | Ubuntu 20.04+, Debian 10+, CentOS 7+ |
| **Linux ARM64 (glibc)** | Ubuntu 20.04 ARM+ |
| **Linux x86-64 (musl)** | Alpine 3.19+ |
| **Linux ARM64 (musl)** | Alpine ARM |
| **macOS Apple Silicon** | M1/M2/M3, macOS 13+ |
| **macOS Intel** | Intel, macOS 13+ |
| **Windows x86-64** | Windows 10+ |
| **Windows ARM64** | Windows 11 ARM |


> **`DISABLE_AUTOUPDATER=1`** 由 launcher 脚本自动注入。
> 二进制文件不会尝试联网更新，完全适合离线/气隙环境。

## 目录结构

```
claude-portable-<platform>-v2.1.160/
├── claude          ← launcher（注入 DISABLE_AUTOUPDATER=1，然后 exec 真实二进制）
├── bin/
│   └── claude-real ← Anthropic 官方二进制（~227 MB，自包含）
└── portable-metadata.json
```

Windows 下以 `claude.cmd`（CMD）和 `claude.ps1`（PowerShell）代替 Unix 的 `claude` launcher。

## 工作原理

1. GitHub Actions 每 3 小时轮询 npm，检测 `@anthropic-ai/claude-code` 新版本。
2. 发现新版本后，由 Claude（claude-opus-4-7）自动生成 Release Notes 并创建 GitHub Release。
3. 8 个并行构建任务分别提取各平台官方二进制，包装 launcher 脚本后打包归档。
4. 发布前对每个平台进行 smoke test 验证。
5. 本 README 在每次发布后自动从 release 元数据重新生成。

## 许可证

Claude Code 二进制文件由 Anthropic 依据其[服务条款](https://www.anthropic.com/legal/consumer-terms)分发。
本仓库的 launcher 脚本和打包工具采用 MIT 许可证。
