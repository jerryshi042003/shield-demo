/**
 * Structured error logging utility for production monitoring
 * Provides consistent error formatting and context for debugging
 */

export interface ErrorLogContext {
  route?: string;
  method?: string;
  userId?: string;
  requestId?: string;
  azureBlobUrl?: string;
  statusCode?: number;
  userAgent?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface StructuredError {
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  route: string;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  context: ErrorLogContext;
}

/**
 * Log structured error information for production monitoring
 */
export function logError(
  error: Error | unknown,
  route: string,
  context: ErrorLogContext = {}
): void {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  
  const structuredLog: StructuredError = {
    timestamp: new Date().toISOString(),
    level: 'error',
    message: `API Error in ${route}: ${errorObj.message}`,
    route,
    error: {
      name: errorObj.name,
      message: errorObj.message,
      stack: process.env.NODE_ENV === 'development' ? errorObj.stack : undefined
    },
    context: {
      ...context,
      timestamp: new Date().toISOString(),
    }
  };

  // For now, log to console. Later can easily add Sentry, DataDog, etc.
  console.error('[CROWN_BIZ_ERROR]', JSON.stringify(structuredLog, null, 2));
}

/**
 * Log warning-level information
 */
export function logWarn(
  message: string,
  route: string,
  context: ErrorLogContext = {}
): void {
  const structuredLog: Omit<StructuredError, 'error'> = {
    timestamp: new Date().toISOString(),
    level: 'warn',
    message: `Warning in ${route}: ${message}`,
    route,
    context: {
      ...context,
      timestamp: new Date().toISOString(),
    }
  };

  console.warn('[CROWN_BIZ_WARN]', JSON.stringify(structuredLog, null, 2));
}

/**
 * Log info-level information (for monitoring successful operations)
 */
export function logInfo(
  message: string,
  route: string,
  context: ErrorLogContext = {}
): void {
  const structuredLog: Omit<StructuredError, 'error'> = {
    timestamp: new Date().toISOString(),
    level: 'info',
    message: `${route}: ${message}`,
    route,
    context: {
      ...context,
      timestamp: new Date().toISOString(),
    }
  };

  // Only log info in development or when explicitly enabled
  if (process.env.NODE_ENV === 'development' || process.env.CROWN_BIZ_VERBOSE_LOGGING === 'true') {
    console.warn('[CROWN_BIZ_INFO]', JSON.stringify(structuredLog, null, 2));
  }
}