import assert from 'node:assert/strict';
import test from 'node:test';
import { EventEmitter } from 'node:events';
import { requestDiagnostics } from '../middleware/requestDiagnostics.js';
import { generateWithRetry, countWithDeadline } from './geminiRequests.js';
import { OPTIMIZE_SCHEMA, SCORE_SCHEMA, COMPARE_SCHEMA, CONVERT_SCHEMA } from '../prompts/systemPrompts.js';

process.env.GEMINI_API_KEY = 'offline-test';
const { generateJSON, generateJSONStream } = await import('./geminiService.js');

function checkTypes(schema) {
  assert.ok(['object', 'array', 'string', 'integer', 'number', 'boolean', 'null'].includes(schema.type));
  Object.values(schema.properties ?? {}).forEach(checkTypes);
  if (schema.items) checkTypes(schema.items);
}

test('four valid schema type trees are serialized by the installed SDK', async (t) => {
  let sent;
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    const body = await new Request(url, init).json();
    sent = body.generationConfig.responseJsonSchema;
    return Response.json({ candidates: [{ content: { parts: [{ text: '{}' }] } }] });
  });
  for (const schema of [OPTIMIZE_SCHEMA, SCORE_SCHEMA, COMPARE_SCHEMA, CONVERT_SCHEMA]) {
    await generateJSON('test', 'draft', schema);
    assert.deepEqual(sent, schema);
    checkTypes(sent);
  }
});

test('partial output prevents retry after a transport failure', async (t) => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    calls++;
    let sent = false;
    const body = new ReadableStream({
      pull(controller) {
        if (sent) throw Object.assign(new Error('interrupted'), { status: 503 });
        sent = true;
        const chunk = { candidates: [{ content: { parts: [{ text: 'partial' }] } }] };
        controller.enqueue(new TextEncoder().encode('data: ' + JSON.stringify(chunk) + '\n\n'));
      },
    });
    return new Response(body, { headers: { 'Content-Type': 'text/event-stream' } });
  });
  const chunks = [];
  await assert.rejects(generateJSONStream('test', 'draft', OPTIMIZE_SCHEMA, s => chunks.push(s)),
    { code: 'STREAM_INTERRUPTED' });
  assert.deepEqual(chunks, ['partial']);
  assert.equal(calls, 1);
});

function start(run) {
  const res = new EventEmitter();
  res.setHeader = () => {};
  let pending;
  requestDiagnostics({ method: 'POST', path: '/optimize' }, res, () => { pending = run(); });
  return { res, pending };
}

test('request deadline ends generation even if the provider ignores abort', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let received;
  const { res, pending } = start(() => generateWithRetry((_, signal) => {
    received = signal;
    return new Promise(() => {});
  }, 'primary'));
  t.mock.timers.tick(55000);
  await assert.rejects(pending, { code: 'AI_TIMEOUT' });
  assert.ok(received.aborted);
  res.emit('finish');
});

test('disconnect aborts an outstanding token count', async () => {
  let received;
  const { res, pending } = start(() => countWithDeadline({
    countTokens({ config }) {
      received = config.abortSignal;
      return new Promise(() => {});
    },
  }, 'primary', 'draft'));
  res.emit('close');
  await assert.rejects(pending, { code: 'CLIENT_DISCONNECTED' });
  assert.ok(received.aborted);
});

test('disconnect interrupts retry backoff', async () => {
  let attempts = 0;
  const { res, pending } = start(() => generateWithRetry(async () => {
    attempts++;
    throw { status: 503 };
  }, 'primary'));
  await new Promise(resolve => setImmediate(resolve));
  res.emit('close');
  await assert.rejects(pending, { code: 'CLIENT_DISCONNECTED' });
  assert.equal(attempts, 1);
});
