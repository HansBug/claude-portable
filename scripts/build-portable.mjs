#!/usr/bin/env node
/**
 * Build a portable Claude Code archive for a specific platform.
 *
 * Usage:
 *   node scripts/build-portable.mjs --version 2.1.116 --platform linux-x64 --output dist
 */
import { execSync } from 'child_process';
import {
  mkdirSync, copyFileSync, writeFileSync, chmodSync,
  existsSync, readdirSync, statSync, readFileSync,
} from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const argv = process.argv.slice(2);
function getArg(name) {
  const idx = argv.indexOf(`--${name}`);
  return idx >= 0 ? argv[idx + 1] : null;
}

const version = getArg('version');
const platform = getArg('platform');
const outputDir = getArg('output') ?? 'dist';

if (!version) { console.error('--version required'); process.exit(1); }
if (!platform) { console.error('--platform required'); process.exit(1); }

// ---------------------------------------------------------------------------
// Platform config
// ---------------------------------------------------------------------------
const PLATFORMS = {
  'linux-x64':        { directPkg: null,                                        isWindows: false },
  'linux-arm64':      { directPkg: null,                                        isWindows: false },
  'linux-x64-musl':   { directPkg: '@anthropic-ai/claude-code-linux-x64-musl',  isWindows: false },
  'linux-arm64-musl': { directPkg: '@anthropic-ai/claude-code-linux-arm64-musl',isWindows: false },
  'darwin-arm64':     { directPkg: null,                                        isWindows: false },
  'darwin-x64':       { directPkg: null,                                        isWindows: false },
  'win32-x64':        { directPkg: null,                                        isWindows: true  },
  'win32-arm64':      { directPkg: null,                                        isWindows: true  },
};

const PLATFORM_PKG_NAMES = {
  'linux-x64':    'claude-code-linux-x64',
  'linux-arm64':  'claude-code-linux-arm64',
  'darwin-arm64': 'claude-code-darwin-arm64',
  'darwin-x64':   'claude-code-darwin-x64',
  'win32-x64':    'claude-code-win32-x64',
  'win32-arm64':  'claude-code-win32-arm64',
};

const cfg = PLATFORMS[platform];
if (!cfg) { console.error(`Unknown platform: ${platform}`); process.exit(1); }

const { isWindows } = cfg;
const archiveExt = isWindows ? 'zip' : 'tar.gz';
const bundleName = `claude-portable-${platform}-v${version}`;
const workDir    = join(ROOT, '.work', platform);
const installDir = join(workDir, 'install');
const distDir    = join(ROOT, outputDir);
const bundleDir  = join(distDir, bundleName);

// ---------------------------------------------------------------------------
// Install npm package
// ---------------------------------------------------------------------------
mkdirSync(installDir, { recursive: true });
mkdirSync(join(bundleDir, 'bin'), { recursive: true });

let installTarget;
if (cfg.directPkg) {
  // musl: install the specific platform package directly
  installTarget = `"${cfg.directPkg}@${version}"`;
} else {
  installTarget = `"@anthropic-ai/claude-code@${version}"`;
}

console.log(`\n[1/4] Installing ${installTarget} ...`);
execSync(
  `npm install ${installTarget} --ignore-scripts --no-save --no-package-lock --prefix "${installDir}"`,
  { stdio: 'inherit' }
);

// ---------------------------------------------------------------------------
// Find the binary
// ---------------------------------------------------------------------------
// When installed with --ignore-scripts the postinstall that copies the binary
// to bin/claude.exe is skipped, so bin/claude.exe is just an error stub.
// The real binary lives at the root of the platform-specific package.
function findBinary() {
  const nm = join(installDir, 'node_modules', '@anthropic-ai');

  // Only return path if it's a real large binary (>50 MB)
  function realBin(p) {
    if (!existsSync(p)) return null;
    try { return statSync(p).size > 50 * 1024 * 1024 ? p : null; }
    catch { return null; }
  }

  if (cfg.directPkg) {
    // musl: package installed directly, binary at package root
    const pkgDirName = cfg.directPkg.replace('@anthropic-ai/', '');
    for (const name of ['claude', 'claude.exe']) {
      const found = realBin(join(nm, pkgDirName, name));
      if (found) return found;
    }
  } else {
    // Standard: npm installs the platform sub-package at top level.
    // Check top-level platform package first (reliable with --ignore-scripts).
    const subPkgName = PLATFORM_PKG_NAMES[platform];
    if (subPkgName) {
      for (const name of ['claude', 'claude.exe']) {
        const found = realBin(join(nm, subPkgName, name));
        if (found) return found;
        // Also try nested (older npm hoisting)
        const found2 = realBin(join(nm, 'claude-code', 'node_modules', '@anthropic-ai', subPkgName, name));
        if (found2) return found2;
      }
    }
    // Fallback: bin/claude.exe if postinstall did run
    const mainBin = realBin(join(nm, 'claude-code', 'bin', 'claude.exe'));
    if (mainBin) return mainBin;
  }

  // Last resort: walk node_modules for any large file
  console.warn('Binary not found at expected paths, scanning...');
  function scan(dir, depth = 0) {
    if (depth > 4) return null;
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      try {
        const st = statSync(full);
        if (st.isDirectory()) {
          const found = scan(full, depth + 1);
          if (found) return found;
        } else if (st.size > 50 * 1024 * 1024 && !entry.endsWith('.json') && !entry.endsWith('.md')) {
          return full;
        }
      } catch { /* ignore */ }
    }
    return null;
  }
  return scan(join(installDir, 'node_modules'));
}

console.log('\n[2/4] Locating binary ...');
const binaryPath = findBinary();
if (!binaryPath) { console.error('ERROR: Could not find binary'); process.exit(1); }
console.log(`      Found: ${binaryPath}`);

// ---------------------------------------------------------------------------
// Copy binary and create launchers
// ---------------------------------------------------------------------------
console.log('\n[3/4] Building bundle ...');

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
  // Resolve symlinks so the launcher works even when placed in PATH via symlink.
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
}, null, 2) + '\n');

// ---------------------------------------------------------------------------
// Create archive
// ---------------------------------------------------------------------------
console.log(`\n[4/4] Creating ${archiveExt} archive ...`);
mkdirSync(distDir, { recursive: true });

const archivePath = join(distDir, `${bundleName}.${archiveExt}`);

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

console.log(`\nDone: ${archivePath}`);
