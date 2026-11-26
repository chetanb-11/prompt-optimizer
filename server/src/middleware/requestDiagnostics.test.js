import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import {
  requestDiagnostics, recordFirstOutput, recordRequestError, logModelEvent,
} from './requestDiagnostics.js';

function start(path, next) {
  const res = new EventEmitter();
  res.headersSent = true;
  res.statusCode = 200;
  res.setHeader = (_, id) => { res.requestId = id; };
  requestDiagnostics({ method: 'POST', path, body: { prompt: 'private draft' } }, res, next);
  return res;
}

test('first output and fallback are attributed to the same request without logging content', (t) => {
  const entries = [];
  const capture = line => entries.push(JSON.parse(line));
  t.mock.method(console, 'warn', capture);
  t.mock.method(console, 'info', capture);

  const res = start('/optimize', () => {
    recordFirstOutput();
    logModelEvent('model_fallback', 'fallback-model', { status: 503, message: 'private draft' });
  });
  res.emit('finish');
  res.emit('close');

  const [fallback, completion] = entries;
  assert.equal(entries.length, 2);
  assert.equal(fallback.requestId, res.requestId);
  assert.equal(completion.requestId, res.requestId);
  assert.equal(fallback.providerStatus, 503);
  assert.equal(completion.outcome, 'completed');
  assert.ok(completion.firstOutputMs >= 0);
  assert.ok(completion.durationMs >= completion.firstOutputMs);
  assert.ok(!JSON.stringify(entries).includes('private draft'));
});

test('an SSE timeout differs from an interrupted connection even with HTTP 200', (t) => {
  const entries = [];
  t.mock.method(console, 'info', line => entries.push(JSON.parse(line)));
  start('/optimize/iterate', () => recordRequestError('AI_TIMEOUT')).emit('finish');
  start('/optimize', () => {}).emit('close');

  assert.equal(entries[0].outcome, 'failed');
  assert.equal(entries[0].errorCode, 'AI_TIMEOUT');
  assert.equal(entries[1].outcome, 'client_disconnected');
  assert.equal(entries[1].firstOutputMs, null);
  assert.notEqual(entries[0].requestId, entries[1].requestId);
});
