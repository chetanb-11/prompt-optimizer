import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

const requests = new AsyncLocalStorage();
const operations = new Map([
  ['/optimize', 'optimize'], ['/optimize/iterate', 'reoptimize'],
  ['/score', 'score'], ['/compare', 'compare'], ['/convert', 'convert'], ['/chain', 'chain'],
]);

export function requestDiagnostics(req, res, next) {
  const operation = operations.get(req.path.replace(/\/$/, ''));
  if (req.method !== 'POST' || !operation) return next();

  const request = {
    requestId: randomUUID(), operation, started: performance.now(),
    firstOutputMs: null, errorCode: null,
  };
  res.setHeader('X-Request-Id', request.requestId);

  function finish(outcome) {
    res.off('finish', onFinish);
    res.off('close', onClose);
    console.info(JSON.stringify({
      event: 'request_finished', requestId: request.requestId, operation, outcome,
      status: res.headersSent ? res.statusCode : null,
      errorCode: request.errorCode, firstOutputMs: request.firstOutputMs,
      durationMs: Math.round(performance.now() - request.started),
    }));
  }
  function onFinish() {
    finish(request.errorCode || res.statusCode >= 400 ? 'failed' : 'completed');
  }
  function onClose() {
    finish('client_disconnected');
  }
  res.once('finish', onFinish);
  res.once('close', onClose);
  requests.run(request, next);
}

export function recordFirstOutput() {
  const request = requests.getStore();
  if (request && request.firstOutputMs === null) {
    request.firstOutputMs = Math.round(performance.now() - request.started);
  }
}

export function recordRequestError(code) {
  const request = requests.getStore();
  if (request) request.errorCode = code;
}

export function logModelEvent(event, model, error) {
  const status = Number(error?.status || error?.httpStatusCode);
  console.warn(JSON.stringify({
    event, requestId: requests.getStore()?.requestId ?? null, model,
    providerStatus: Number.isInteger(status) && status > 0 ? status : null,
  }));
}

export function recordModelTiming(stage, started) {
  console.info(JSON.stringify({
    event: 'model_timing', requestId: requests.getStore()?.requestId ?? null,
    stage, durationMs: Math.round(performance.now() - started),
  }));
}
