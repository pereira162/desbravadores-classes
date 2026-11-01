const MAX_LOGS = 60;
const capturedLogs = [];
let lastErrorStack = '';
let initialized = false;

function formatArg(arg) {
  if (arg instanceof Error) {
    return `${arg.name}: ${arg.message}\n${arg.stack || ''}`;
  }
  if (typeof arg === 'object' && arg !== null) {
    try {
      return JSON.stringify(arg);
    } catch {
      return String(arg);
    }
  }
  return String(arg);
}

function pushLog(level, args) {
  try {
    const message = Array.from(args).map(formatArg).join(' ').slice(0, 600);
    capturedLogs.push({
      timestamp: new Date().toISOString(),
      level,
      message,
    });
    if (capturedLogs.length > MAX_LOGS) {
      capturedLogs.shift();
    }
  } catch {
    // ignore logging errors
  }
}

export function initBrowserLogger() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  const origWarn = console.warn;
  const origError = console.error;
  const origInfo = console.info;

  console.warn = function (...args) {
    pushLog('WARN', args);
    return origWarn.apply(console, args);
  };

  console.error = function (...args) {
    pushLog('ERROR', args);
    const firstErr = args.find((a) => a instanceof Error);
    if (firstErr?.stack) {
      lastErrorStack = firstErr.stack;
    }
    return origError.apply(console, args);
  };

  console.info = function (...args) {
    pushLog('INFO', args);
    return origInfo.apply(console, args);
  };

  window.addEventListener('error', (event) => {
    const stack = event.error?.stack || `${event.message} (${event.filename}:${event.lineno})`;
    lastErrorStack = stack;
    pushLog('UNCAUGHT_ERROR', [stack]);
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason?.stack || event.reason?.message || String(event.reason);
    lastErrorStack = reason;
    pushLog('UNHANDLED_PROMISE', [reason]);
  });
}

export function getCapturedBrowserLogs() {
  return [...capturedLogs];
}

export function getLastErrorStack() {
  return lastErrorStack;
}
