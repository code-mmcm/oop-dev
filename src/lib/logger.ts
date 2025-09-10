// Lightweight logger utility emulating Winston-style levels for browser usage
// JSDoc: Provides consistent logging across the app with level-based methods.

type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';

interface LoggerOptions {
  namespace?: string;
  enabled?: boolean;
}

/**
 * Creates a namespaced logger with level methods.
 * This mimics a subset of Winston's API for frontend use without extra deps.
 */
export const createLogger = (options: LoggerOptions = {}) => {
  const { namespace = 'app', enabled = true } = options;

  const format = (level: LogLevel, message: unknown, meta?: unknown) => {
    const time = new Date().toISOString();
    return [`[${time}] [${namespace}] [${level.toUpperCase()}]`, message, meta];
  };

  const logIfEnabled = (cb: () => void) => {
    if (!enabled) return;
    cb();
  };

  return {
    /** Logs an error condition */
    error: (message: unknown, meta?: unknown) =>
      logIfEnabled(() => console.error(...format('error', message, meta))),
    /** Logs a warning condition */
    warn: (message: unknown, meta?: unknown) =>
      logIfEnabled(() => console.warn(...format('warn', message, meta))),
    /** Logs informational message */
    info: (message: unknown, meta?: unknown) =>
      logIfEnabled(() => console.info(...format('info', message, meta))),
    /** Logs debug details useful during development */
    debug: (message: unknown, meta?: unknown) =>
      logIfEnabled(() => console.debug(...format('debug', message, meta))),
  };
};

/** Default app logger */
export const logger = createLogger({ namespace: 'oop-dev', enabled: true });


