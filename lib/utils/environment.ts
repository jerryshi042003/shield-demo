/**
 * Environment detection utilities for error handling behavior
 */

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function shouldShowDebugErrors(): boolean {
  // Show debug errors in development OR if explicitly enabled
  return isDevelopment() || process.env.SHOW_DEBUG_ERRORS === 'true';
}

export function getEnvironmentName(): string {
  return process.env.NODE_ENV;
}