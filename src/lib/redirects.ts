export function validRedirectDestination(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 500 || !/^\/(?:[a-zA-Z0-9_%\-]+\/)*[a-zA-Z0-9_%\-]*\/?$/.test(value)) return false;
  try { const decoded = decodeURIComponent(value); return !/[\s\\?#]/.test(decoded) && !decoded.includes("..") && !decoded.includes("//") && !/^\/(?:api|preview|entrar|wp-admin|wp-json|wp-content|wp-includes|_next)(?:\/|$)/i.test(decoded); } catch { return false; }
}
