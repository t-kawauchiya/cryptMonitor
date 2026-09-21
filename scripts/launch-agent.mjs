import { mkdir, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const command = process.argv[2] ?? 'status';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const label = 'com.cryptmonitor.agent';
const userId = process.getuid();
const domain = 'gui/' + userId;
const service = domain + '/' + label;
const launchAgentsDir = path.join(homedir(), 'Library', 'LaunchAgents');
const plistPath = path.join(launchAgentsDir, label + '.plist');
const stateDir = path.join(root, '.monitor');

function run(args, options = {}) {
  return spawnSync('/bin/launchctl', args, {
    encoding: 'utf8',
    stdio: options.quiet ? 'pipe' : 'inherit',
  });
}

function xml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function plist() {
  const monitorPath = path.join(root, 'scripts', 'monitor.mjs');
  const stdoutPath = path.join(stateDir, 'launchd.out.log');
  const stderrPath = path.join(stateDir, 'launchd.err.log');
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
    '<plist version="1.0">',
    '<dict>',
    '  <key>Label</key>',
    '  <string>' + label + '</string>',
    '  <key>ProgramArguments</key>',
    '  <array>',
    '    <string>' + xml(process.execPath) + '</string>',
    '    <string>' + xml(monitorPath) + '</string>',
    '  </array>',
    '  <key>WorkingDirectory</key>',
    '  <string>' + xml(root) + '</string>',
    '  <key>RunAtLoad</key>',
    '  <true/>',
    '  <key>KeepAlive</key>',
    '  <true/>',
    '  <key>StandardOutPath</key>',
    '  <string>' + xml(stdoutPath) + '</string>',
    '  <key>StandardErrorPath</key>',
    '  <string>' + xml(stderrPath) + '</string>',
    '</dict>',
    '</plist>',
    '',
  ].join('\n');
}

if (process.platform !== 'darwin') {
  console.error('この自動起動機能はmacOS専用です。');
  process.exit(1);
}

if (command === 'install') {
  await mkdir(launchAgentsDir, { recursive: true });
  await mkdir(stateDir, { recursive: true });
  run(['bootout', domain, plistPath], { quiet: true });
  await writeFile(plistPath, plist(), { mode: 0o644 });
  const bootstrap = run(['bootstrap', domain, plistPath]);
  if (bootstrap.status !== 0) process.exit(bootstrap.status ?? 1);
  run(['kickstart', '-k', service]);
  console.log('cryptMonitorの自動監視を有効にしました。');
  console.log('状態確認: npm run monitor:status');
} else if (command === 'uninstall') {
  run(['bootout', domain, plistPath], { quiet: true });
  await rm(plistPath, { force: true });
  console.log('cryptMonitorの自動監視を解除しました。');
} else if (command === 'status') {
  const result = run(['print', service], { quiet: true });
  if (result.status === 0) {
    console.log('cryptMonitorは自動監視中です。');
    process.exit(0);
  }
  console.log('cryptMonitorの自動監視は未設定です。');
  process.exit(1);
} else {
  console.error('使い方: node scripts/launch-agent.mjs install|uninstall|status');
  process.exit(1);
}
