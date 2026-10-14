import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('floating support renders the connected AI chat widget', () => {
  const floating = readFileSync(join(root, 'src/components/layout/FloatingButtons.tsx'), 'utf8');
  const chat = readFileSync(join(root, 'src/components/layout/ChatWindow.tsx'), 'utf8');
  const api = readFileSync(join(root, 'src/lib/support-chat-api.ts'), 'utf8');

  assert.match(floating, /<ChatWindow \/>/);
  assert.doesNotMatch(floating, /به‌زودی/);
  assert.match(chat, /bottom-4 right-4/);
  assert.match(chat, /sendSupportMessage/);
  assert.match(chat, /fetchSupportHistory/);
  assert.match(chat, /پشتیبانی انسانی/);
  assert.match(api, /\/content\/chat\//);
  assert.match(api, /azadgozar-support-session/);
});
