import { spawn } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '..');
const sourceDirectory = path.join(projectRoot, 'wallabagger');
const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'wallabagger-chrome-'));
const stagingDirectory = path.join(temporaryDirectory, 'wallabagger');

try {
    await cp(sourceDirectory, stagingDirectory, { recursive: true });

    const manifestPath = path.join(stagingDirectory, 'manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    delete manifest.background.scripts;
    delete manifest.browser_specific_settings;
    delete manifest.action.theme_icons;
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    const executable = path.join(
        projectRoot,
        'node_modules',
        '.bin',
        process.platform === 'win32' ? 'web-ext.cmd' : 'web-ext'
    );
    const child = spawn(executable, [
        'build',
        '--source-dir', stagingDirectory,
        '--artifacts-dir', path.join(projectRoot, 'web-ext-artifacts'),
        '--filename', `wallabagger-chrome-${manifest.version}.zip`,
        '--overwrite-dest'
    ], { stdio: 'inherit' });

    const exitCode = await new Promise((resolve, reject) => {
        child.once('error', reject);
        child.once('exit', resolve);
    });
    if (exitCode !== 0) {
        process.exitCode = exitCode;
    }
} finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
}
