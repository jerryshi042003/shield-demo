/**
 * Centralized logging utility for silent error reporting
 * Logs to console in development, Azure Application Insights in production
 */

import { isProduction, shouldShowDebugErrors } from './environment';
import { appInsights } from './applicationInsights';

interface LogContext {
  component?: string;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  [key: string]: unknown;
}

class Logger {
  constructor() {
    // Application Insights is now handled in the applicationInsights module
  }

  error(message: string, error?: Error, context?: LogContext) {
    const logData = {
      message,
      error: error?.message,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      ...context
    };

    if (shouldShowDebugErrors()) {
      // Show in console for development
      console.error('[Logger] Error:', message, error, context);
    }

    if (isProduction()) {
      // Send to Application Insights in production
      appInsights.trackException(error ?? new Error(message), logData);
    }
  }

  warn(message: string, context?: LogContext) {
    const logData = {
      message,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      ...context
    };

    if (shouldShowDebugErrors()) {
      console.warn('[Logger] Warning:', message, context);
    }

    if (isProduction()) {
      appInsights.trackTrace(message, 2, logData); // 2 = Warning severity
    }
  }

  info(message: string, context?: LogContext) {
    if (shouldShowDebugErrors()) {
      console.warn('[Logger] Info:', message, context);
    }
  }

  // Silent error logging - never shows to user, always logs
  silentError(message: string, error?: Error, context?: LogContext) {
    const logData = {
      message,
      error: error?.message,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      ...context
    };

    // Always log to console in development for debugging
    if (!isProduction()) {
      console.error('[Logger] Silent Error:', message, error, context);
    }

    if (isProduction()) {
      appInsights.trackException(error ?? new Error(message), { ...logData, silent: true });
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience exports
export const logError = (message: string, error?: Error, context?: LogContext) => 
  logger.error(message, error, context);

export const logWarning = (message: string, context?: LogContext) => 
  logger.warn(message, context);

export const logInfo = (message: string, context?: LogContext) => 
  logger.info(message, context);

export const logSilentError = (message: string, error?: Error, context?: LogContext) => 
  logger.silentError(message, error, context);