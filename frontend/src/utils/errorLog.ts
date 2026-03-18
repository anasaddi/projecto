/**
 * Structured error logging and user-facing error toasts.
 * Use instead of empty try/catch or bare console.error.
 */

export interface ErrorLogContext {
  page?: string;
  action?: string;
  api?: string;
  userId?: string;
}

export interface ErrorLogExtra {
  [key: string]: unknown;
}

let toastError: ((message: string) => void) | null = null;

export function setToastError(fn: (message: string) => void): void {
  toastError = fn;
}

export function logError(
  context: ErrorLogContext,
  error: unknown,
  extra?: ErrorLogExtra
): void {
  const err = error instanceof Error ? error : new Error(String(error));
  const payload = {
    message: err.message,
    name: err.name,
    context,
    extra: extra ?? {},
    stack: err.stack,
    timestamp: new Date().toISOString(),
  };
  if (typeof window !== "undefined" && window.__LOG_ERROR__) {
    (window as unknown as { __LOG_ERROR__: (p: unknown) => void }).__LOG_ERROR__(payload);
  }
  console.error("[km:error]", payload);
}

export function showErrorToast(message: string): void {
  if (toastError) toastError(message);
  else console.error("[km:error]", message);
}

export function logAndToast(
  context: ErrorLogContext,
  error: unknown,
  userMessage: string,
  extra?: ErrorLogExtra
): void {
  logError(context, error, extra);
  showErrorToast(userMessage);
}
