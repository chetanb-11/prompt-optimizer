import assert from 'node:assert/strict';
import test from 'node:test';
import { generateWithRetry, countWithDeadline } from './geminiRequests.js';

for (const [status, code] of [[400, 'BAD_REQUEST'], [401, 'AUTH_ERROR'], [403, 'AUTH_ERROR']]) {
  test(`stops after one request for HTTP ${status}`, async () => {
    const calls = [];
    await assert.rejects(generateWithRetry(async model => {
      calls.push(model);
      throw { status };
    }, 'primary'), { code });
    assert.deepEqual(calls, ['primary']);
  });
}

test('uses the final provider error when fallback fails', async () => {
  const calls = [];
  await assert.rejects(generateWithRetry(async model => {
    calls.push(model);
    throw { status: model === 'primary' ? 404 : 504 };
  }, 'primary'), { code: 'AI_TIMEOUT', statusCode: 504 });
  assert.deepEqual(calls, ['primary', 'gemini-2.5-flash']);
});

test('recovers from a transient error on the primary model', async () => {
  let calls = 0;
  const result = await generateWithRetry(async () => {
    if (++calls === 1) throw { status: 503 };
    return 'ok';
  }, 'primary');
  assert.equal(result, 'ok');
  assert.equal(calls, 2);
});

test('keeps an exact token count when the provider responds', async () => {
  const models = { countTokens: async () => ({ totalTokens: 9 }) };
  assert.equal(await countWithDeadline(models, 'primary', 'hello'), 9);
});

test('aborts a stalled count and returns an estimate even if the SDK never settles', async () => {
  let signal;
  const models = { countTokens({ config }) {
    signal = config.abortSignal;
    return new Promise(() => {});
  } };
  assert.equal(await countWithDeadline(models, 'primary', 'hello'), 2);
  assert.equal(signal.aborted, true);
});

test('falls back once after four overloaded primary attempts', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const calls = [];
  const pending = generateWithRetry(async model => {
    calls.push(model);
    if (model === 'primary') throw { status: 429 };
    return 'fallback result';
  }, 'primary');
  for (let i = 0; i < 3; i++) {
    await Promise.resolve();
    await Promise.resolve();
    t.mock.timers.tick(10000);
  }
  assert.equal(await pending, 'fallback result');
  assert.deepEqual(calls, ['primary', 'primary', 'primary', 'primary', 'gemini-2.5-flash']);
});
