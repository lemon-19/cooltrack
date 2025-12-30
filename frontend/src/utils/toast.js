// Lightweight global toast helper with type support
let _addToast = (msg) => console.warn('Toast:', msg);

export function registerGlobalToast(fn) {
  _addToast = fn;
}

/**
 * Show a toast notification
 * @param {string|object} message - Message text or { message, type, duration }
 * @param {object} opts - Options: { type, duration }
 *   type: 'success' | 'error' | 'warning' | 'info' (default: 'info')
 *   duration: milliseconds (default: 3000, false = no auto-dismiss)
 */
export function toast(message, opts = {}) {
  try {
    if (typeof message === 'string') {
      _addToast({ message, type: opts.type || 'info', duration: opts.duration !== undefined ? opts.duration : 3000 });
    } else {
      _addToast({ type: 'info', duration: 3000, ...message, ...opts });
    }
  } catch (e) {
    if (import.meta.env.DEV) console.warn('Toast failed', e, message);
  }
}

export function toastSuccess(message, duration = 3000) {
  toast(message, { type: 'success', duration });
}

export function toastError(message, duration = 4000) {
  toast(message, { type: 'error', duration });
}

export function toastWarning(message, duration = 3500) {
  toast(message, { type: 'warning', duration });
}

export function toastInfo(message, duration = 3000) {
  toast(message, { type: 'info', duration });
}
