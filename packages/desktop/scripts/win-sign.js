/**
 * electron-builder custom sign hook for Azure Artifact Signing (Windows).
 *
 * Local-dev signing only — authenticates via AzureCliCredential (run `az login` first).
 *
 * Skips gracefully (unsigned build) when:
 *   - signtool / DLIB / az CLI aren't installed (e.g. contributors forking the repo)
 *   - the user isn't logged into az (no Certificate Profile Signer role on this machine)
 *   - JOTBUNKER_SKIP_SIGN=1 is set (bypass for faster local iteration)
 *
 * Certificate Profile Signer role is the actual gate — unauthorized clones cannot sign
 * as "John Brantly" even with this file public.
 */
const { execFileSync, spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const LOCALAPPDATA = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
const PROGRAM_FILES = process.env.ProgramFiles || 'C:\\Program Files';
const PROGRAM_FILES_X86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

function findSigntool() {
  const binRoot = path.join(PROGRAM_FILES_X86, 'Windows Kits', '10', 'bin');
  if (!fs.existsSync(binRoot)) return null;
  const versions = fs.readdirSync(binRoot)
    .filter(n => /^10\.0\.\d+\.\d+$/.test(n))
    .sort()
    .reverse();
  for (const v of versions) {
    const p = path.join(binRoot, v, 'x64', 'signtool.exe');
    if (fs.existsSync(p)) return p;
  }
  return null;
}

const SIGNTOOL = findSigntool();
const DLIB = path.join(LOCALAPPDATA, 'Microsoft', 'MicrosoftArtifactSigningClientTools', 'Azure.CodeSigning.Dlib.dll');
const AZ_WBIN = path.join(PROGRAM_FILES, 'Microsoft SDKs', 'Azure', 'CLI2', 'wbin');
const AZ_CMD = path.join(AZ_WBIN, 'az.cmd');
const METADATA = path.join(__dirname, 'metadata.json');
const TIMESTAMP_URL = 'http://timestamp.acs.microsoft.com/';

function canSign() {
  if (process.env.JOTBUNKER_SKIP_SIGN === '1') {
    return { ok: false, reason: 'JOTBUNKER_SKIP_SIGN=1 set' };
  }
  if (!SIGNTOOL) return { ok: false, reason: 'signtool.exe not found in Windows Kits — install Windows 10 SDK' };
  if (!fs.existsSync(DLIB)) return { ok: false, reason: 'Azure Artifact Signing DLIB not installed' };
  if (!fs.existsSync(METADATA)) return { ok: false, reason: `metadata.json missing (${METADATA})` };
  if (!fs.existsSync(AZ_CMD)) return { ok: false, reason: 'Azure CLI not installed' };

  const check = spawnSync('cmd.exe', ['/c', AZ_CMD, 'account', 'show'], { stdio: 'ignore' });
  if (check.status !== 0) return { ok: false, reason: 'not logged into Azure CLI (run `az login`)' };

  return { ok: true };
}

exports.default = async function (configuration) {
  const target = configuration.path;

  const gate = canSign();
  if (!gate.ok) {
    console.warn(`[win-sign] SKIPPING signing: ${gate.reason}`);
    console.warn('[win-sign] Output will be unsigned. See incoming/MICROSOFT-AZURE-SIGNING.md');
    return;
  }

  const env = { ...process.env, PATH: `${AZ_WBIN};${process.env.PATH || ''}` };

  console.log(`[win-sign] signing ${target}`);
  execFileSync(
    SIGNTOOL,
    [
      'sign',
      '/v',
      '/fd', 'SHA256',
      '/tr', TIMESTAMP_URL,
      '/td', 'SHA256',
      '/dlib', DLIB,
      '/dmdf', METADATA,
      target,
    ],
    { stdio: 'inherit', env }
  );
};
