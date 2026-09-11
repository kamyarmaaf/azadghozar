import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const standaloneDirectory = join('.next', 'standalone');

if (!existsSync(standaloneDirectory)) {
  throw new Error('Next.js standalone output was not created.');
}

mkdirSync(join(standaloneDirectory, '.next'), { recursive: true });
cpSync(join('.next', 'static'), join(standaloneDirectory, '.next', 'static'), {
  recursive: true,
});
cpSync('public', join(standaloneDirectory, 'public'), { recursive: true });
