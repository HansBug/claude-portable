#!/usr/bin/env node
/**
 * Build a portable Claude Code archive for a specific platform.
 *
 * Uses `npm pack` instead of `npm install` so we can fetch platform-specific
 * packages (including musl) on any runner without hitting EBADPLATFORM.
 *
 * Usage:
 *   node scripts/build-portable.mjs --version 2.1.116 --platform linux-x64 --output dist
 */
import { execSync } from 'child_process';
import {
  mkdirSync, copyFileSync, writeFileSync, chmodSync,
  existsSync, readdirSync, statSync, rmSync,
} from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── CLI args ────────────────────────────────────────────────────────────────
function getArg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  return idx >= 0 ? process.argv[idx + 1] : null;
}
const version   = getArg('version');
const platform  = getArg('platform');
const outputDir = getArg('output') ?? 'dist';

if (!version)  { console.error('--version required');  process.exit(1); }
if (!platform) { console.error('--platform required'); process.exit(1); }

// ── Platform config ─────────────────────────────────────────────────────────
const PLATFORMS = {
  'linux-x64':        { pkg: 'claude-code-linux-x64',        isWindows: false },
  'linux-arm64':      { pkg: 'claude-code-linux-arm64',      isWindows: false },
  'linux-x64-musl':   { pkg: 'claude-code-linux-x64-musl',   isWindows: false },
  'linux-arm64-musl': { pkg: 'claude-code-linux-arm64-musl', isWindows: false },
  'darwin-arm64':     { pkg: 'claude-code-darwin-arm64',     isWindows: false },
  'darwin-x64':       { pkg: 'claude-code-darwin-x64',       isWindows: false },
  'win32-x64':        { pkg: 'claude-code-win32-x64',        isWindows: true  },
  'win32-arm64':      { pkg: 'claude-code-win32-arm64',      isWindows: true  },
};

const cfg = PLATFORMS[platform];
if (!cfg) { console.error(`Unknown platform: ${platform}`); process.exit(1); }

const { isWindows } = cfg;
const archiveExt = isWindows ? 'zip' : 'tar.gz';
const bundleName = `claude-portable-${platform}-v${version}`;
const workDir    = join(ROOT, '.work', platform);
const distDir    = resolve(ROOT, outputDir);
const bundleDir  = join(distDir, bundleName);

// Clean previous work
if (existsSync(workDir)) rmSync(workDir, { recursive: true, force: true });
if (existsSync(bundleDir)) rmSync(bundleDir, { recursive: true, force: true });
mkdirSync(workDir, { recursive: true });
mkdirSync(join(bundleDir, 'bin'), { recursive: true });
mkdirSync(distDir, { recursive: true });

// ── 1. Fetch tarball via `npm pack` (no platform check) ─────────────────────
const fullPkg = `@anthropic-ai/${cfg.pkg}@${version}`;
console.log(`\n[1/4] npm pack ${fullPkg} ...`);
execSync(`npm pack "${fullPkg}" --pack-destination "${workDir}"`, { stdio: 'inherit' });

const tarball = readdirSync(workDir).find(f => f.endsWith('.tgz'));
if (!tarball) { console.error('No .tgz downloaded'); process.exit(1); }
console.log(`      Downloaded: ${tarball}`);

// ── 2. Extract tarball ──────────────────────────────────────────────────────
console.log(`\n[2/4] Extracting tarball ...`);
const extractDir = join(workDir, 'extracted');
mkdirSync(extractDir, { recursive: true });
execSync(`tar -xzf "${join(workDir, tarball)}" -C "${extractDir}"`, { stdio: 'inherit' });

// npm tarballs always unpack to package/
const pkgRoot = join(extractDir, 'package');

// ── 3. Locate binary ────────────────────────────────────────────────────────
const binCandidates = isWindows ? ['claude.exe', 'claude'] : ['claude', 'claude.exe'];
let binaryPath = null;
for (const name of binCandidates) {
  const p = join(pkgRoot, name);
  if (existsSync(p) && statSync(p).size > 50 * 1024 * 1024) {
    binaryPath = p;
    break;
  }
}
if (!binaryPath) {
  console.error(`No binary >50 MB found in ${pkgRoot}`);
  console.error(`Contents:`, readdirSync(pkgRoot));
  process.exit(1);
}
console.log(`      Binary: ${binaryPath} (${(statSync(binaryPath).size / 1024 / 1024).toFixed(0)} MB)`);

// ── 4. Assemble bundle: copy binary, write launcher, write metadata ─────────
console.log(`\n[3/4] Assembling bundle ...`);
const realBinName = isWindows ? 'claude-real.exe' : 'claude-real';
const destBinPath = join(bundleDir, 'bin', realBinName);
copyFileSync(binaryPath, destBinPath);
if (!isWindows) chmodSync(destBinPath, 0o755);

if (isWindows) {
  writeFileSync(join(bundleDir, 'claude.cmd'),
`@echo off
setlocal
set DISABLE_AUTOUPDATER=1
"%~dp0bin\\claude-real.exe" %*
endlocal
`);
  writeFileSync(join(bundleDir, 'claude.ps1'),
`$env:DISABLE_AUTOUPDATER = "1"
& "$PSScriptRoot\\bin\\claude-real.exe" @args
`);
} else {
  // Resolve symlinks so the launcher works when placed in PATH via symlink.
  writeFileSync(join(bundleDir, 'claude'),
`#!/bin/sh
SELF="$0"
while [ -L "$SELF" ]; do
  SELF_DIR="$(cd "$(dirname "$SELF")" && pwd)"
  SELF="$(readlink "$SELF")"
  case "$SELF" in /*) ;; *) SELF="$SELF_DIR/$SELF" ;; esac
done
SCRIPT_DIR="$(cd "$(dirname "$SELF")" && pwd)"
export DISABLE_AUTOUPDATER=1
exec "$SCRIPT_DIR/bin/claude-real" "$@"
`);
  chmodSync(join(bundleDir, 'claude'), 0o755);
}

writeFileSync(join(bundleDir, 'portable-metadata.json'), JSON.stringify({
  version,
  platform,
  builtAt: new Date().toISOString(),
  source: 'https://github.com/HansBug/claude-portable',
  upstreamPackage: `@anthropic-ai/${cfg.pkg}@${version}`,
}, null, 2) + '\n');

// ── 5. Archive ──────────────────────────────────────────────────────────────
console.log(`\n[4/4] Creating ${archiveExt} archive ...`);
const archivePath = join(distDir, `${bundleName}.${archiveExt}`);
if (existsSync(archivePath)) rmSync(archivePath);

if (isWindows) {
  execSync(
    `powershell -NoProfile -Command "Compress-Archive -Path '${bundleDir}' -DestinationPath '${archivePath}' -Force"`,
    { stdio: 'inherit' }
  );
} else {
  execSync(
    `tar -czf "${archivePath}" -C "${distDir}" "${bundleName}"`,
    { stdio: 'inherit' }
  );
}

const archiveSize = (statSync(archivePath).size / 1024 / 1024).toFixed(1);
console.log(`\n✓ Built ${archivePath} (${archiveSize} MB)`);
