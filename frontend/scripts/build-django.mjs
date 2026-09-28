import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const frontendRoot = process.cwd();
const explicitDjangoRoot = process.env.DJANGO_PROJECT_ROOT
  ? resolve(process.env.DJANGO_PROJECT_ROOT)
  : null;
const djangoCandidates = explicitDjangoRoot
  ? [explicitDjangoRoot]
  : [
      resolve(frontendRoot, '..', 'backend'),
      resolve(frontendRoot, '..', 'backend', 'backend'),
      resolve(frontendRoot, '..'),
    ];
const djangoRoot = djangoCandidates.find((candidate) =>
  existsSync(join(candidate, 'manage.py'))
);

if (!djangoRoot) {
  throw new Error(
    `Django project was not found. Checked: ${djangoCandidates.join(', ')}. `
    + 'Set DJANGO_PROJECT_ROOT to the folder containing manage.py.',
  );
}

const nextCli = join(frontendRoot, 'node_modules', 'next', 'dist', 'bin', 'next');
const build = spawnSync(process.execPath, [nextCli, 'build'], {
  cwd: frontendRoot,
  env: {
    ...process.env,
    NEXT_BUILD_TARGET: 'django',
    NEXT_PUBLIC_API_BASE_URL: '/api/v1',
  },
  stdio: 'inherit',
});

if (build.status !== 0) process.exit(build.status || 1);

const outputRoot = join(frontendRoot, 'out');
const templateRoot = join(djangoRoot, 'templates', 'frontend');
const staticRoot = join(djangoRoot, 'static', 'frontend');
const publicRoot = join(djangoRoot, 'frontend_public');

for (const target of [templateRoot, staticRoot, publicRoot]) {
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
}

cpSync(join(outputRoot, 'index.html'), join(templateRoot, 'index.html'));
cpSync(join(outputRoot, '_next'), join(staticRoot, '_next'), { recursive: true });
cpSync(join(frontendRoot, 'public'), publicRoot, { recursive: true });

console.log(`Django frontend bundle created in ${djangoRoot}`);
