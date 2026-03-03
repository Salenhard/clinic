export type SafeEvalOptions = {
  maxLen?: number;
};

const DEFAULT_MAX_LEN = 500;

const FORBIDDEN_PATTERNS: RegExp[] = [
  /\bprocess\b/i,
  /\brequire\b/i,
  /\bimport\b/i,
  /\bexport\b/i,
  /\bglobalThis\b/i,
  /\bglobal\b/i,
  /\bwindow\b/i,
  /\bdocument\b/i,
  /\bFunction\b/,
  /\beval\b/,
  /\bconstructor\b/i,
  /\b__proto__\b/i
];

export function assertSafeExpression(expr: string, opts: SafeEvalOptions = {}) {
  const maxLen = opts.maxLen ?? DEFAULT_MAX_LEN;

  if (typeof expr !== "string" || expr.trim().length === 0) {
    throw new Error("Expression must be a non-empty string");
  }

  if (expr.length > maxLen) {
    throw new Error(`Expression too long (> ${maxLen})`);
  }

  for (const re of FORBIDDEN_PATTERNS) {
    if (re.test(expr)) {
      throw new Error(`Forbidden token/pattern detected: ${re}`);
    }
  }
}

/**
 * Минимально безопасное вычисление boolean-выражения.
 * Доступен только аргумент ctx (контекст консультации).
 */
export function safeEvalBoolean(expr: string, ctx: unknown, opts: SafeEvalOptions = {}): boolean {
  assertSafeExpression(expr, opts);

  // eslint-disable-next-line no-new-func
  const fn = new Function("ctx", `"use strict"; return ( ${expr} );`);
  return Boolean(fn(ctx));
}