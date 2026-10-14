// Expression evaluator for the transaction amount calculator.
//
// Deliberately dependency-free and side-effect-free so it can be unit tested
// directly. Supports the operations that matter when totalling a receipt:
//   + - x / , parentheses, a percent postfix, and a leading unary minus.
//
// Percent is a postfix that divides by 100, matching phone calculators, so
// "2500 + 10%" is 2750 (2500 plus 10 percent of 2500).

export type CalcResult =
  | { ok: true; value: number }
  | { ok: false; error: string };

/** Largest number we allow, to keep results finite and sane. */
const MAX_VALUE = 1e15;
/** Guards against pathological input like thousands of open parens. */
const MAX_EXPRESSION_LENGTH = 200;

class ParseError extends Error {}

type Token = { type: "number"; value: number } | { type: "op"; value: string };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    if (ch === " ") {
      i++;
      continue;
    }

    if (/[0-9.,]/.test(ch)) {
      const start = i;
      let seenDot = false;
      while (i < input.length && /[0-9.,]/.test(input[i])) {
        if (input[i] === ".") {
          if (seenDot) throw new ParseError("Too many decimal points");
          seenDot = true;
        }
        i++;
      }
      // Commas are thousands separators. The amount field displays "1,250", so
      // a prefilled value must parse rather than being read as two numbers.
      const raw = input.slice(start, i).replace(/,/g, "");
      if (!/^\d+(\.\d+)?$|^\.\d+$/.test(raw)) throw new ParseError("Invalid number");
      const value = Number(raw);
      if (!Number.isFinite(value)) throw new ParseError("Invalid number");
      tokens.push({ type: "number", value });
      continue;
    }

    if (ch === "(" || ch === ")") {
      tokens.push({ type: "op", value: ch });
      i++;
      continue;
    }

    if (ch === "x" || ch === "X" || ch === "*") {
      tokens.push({ type: "op", value: "*" });
      i++;
      continue;
    }

    if (ch === "÷" || ch === "/") {
      tokens.push({ type: "op", value: "/" });
      i++;
      continue;
    }

    if (ch === "−" || ch === "-") {
      tokens.push({ type: "op", value: "-" });
      i++;
      continue;
    }

    if (ch === "+" || ch === "%") {
      tokens.push({ type: "op", value: ch });
      i++;
      continue;
    }

    throw new ParseError(`Unexpected "${ch}"`);
  }

  return tokens;
}

// A parsed operand plus whether it carried a percent postfix, which changes how
// + and - treat it.
interface Operand {
  value: number;
  percent: boolean;
}

function evaluateTokens(tokens: Token[]): number {
  let pos = 0;

  const peek = (): Token | undefined => tokens[pos];

  const parseExpression = (): Operand => {
    let left = parseTerm();
    for (;;) {
      const token = peek();
      if (token?.type === "op" && (token.value === "+" || token.value === "-")) {
        pos++;
        const right = parseTerm();
        // "2500 + 10%" means ten percent *of 2500*, so a percent operand on the
        // right of + or - scales the left side. For * and / a percent is just
        // its fractional value, which parseTerm already handles.
        const delta = right.percent ? left.value * right.value : right.value;
        left = { value: token.value === "+" ? left.value + delta : left.value - delta, percent: false };
        assertFinite(left.value);
      } else {
        return left;
      }
    }
  };

  const parseTerm = (): Operand => {
    let left = parseUnary();
    for (;;) {
      const token = peek();
      if (token?.type === "op" && (token.value === "*" || token.value === "/")) {
        pos++;
        const right = parseUnary();
        if (token.value === "/" && right.value === 0) throw new ParseError("Cannot divide by zero");
        const value = token.value === "*" ? left.value * right.value : left.value / right.value;
        left = { value, percent: false };
        assertFinite(value);
      } else {
        return left;
      }
    }
  };

  const parseUnary = (): Operand => {
    const token = peek();
    if (token?.type === "op" && (token.value === "-" || token.value === "+")) {
      pos++;
      const operand = parseUnary();
      // Negation produces a plain number, not a percentage.
      return { value: token.value === "-" ? -operand.value : operand.value, percent: false };
    }
    return parsePercent();
  };

  // Postfix percent, e.g. "10%" -> 0.1, and "50%%" -> 0.005.
  const parsePercent = (): Operand => {
    let operand = parsePrimary();
    while (peek()?.type === "op" && (peek() as { value: string }).value === "%") {
      pos++;
      operand = { value: operand.value / 100, percent: true };
    }
    return operand;
  };

  const parsePrimary = (): Operand => {
    const token = peek();
    if (!token) throw new ParseError("Incomplete expression");

    if (token.type === "number") {
      pos++;
      return { value: token.value, percent: false };
    }

    if (token.type === "op" && token.value === "(") {
      pos++;
      const inner = parseExpression();
      const closing = peek();
      if (!closing || closing.type !== "op" || closing.value !== ")") {
        throw new ParseError("Missing closing bracket");
      }
      pos++;
      return { value: inner.value, percent: false };
    }

    throw new ParseError("Incomplete expression");
  };

  const result = parseExpression();

  if (pos < tokens.length) {
    throw new ParseError("Unexpected input");
  }

  return result.value;
}

function assertFinite(value: number) {
  if (!Number.isFinite(value) || Math.abs(value) > MAX_VALUE) {
    throw new ParseError("Result is too large");
  }
}

/** Rounds away binary floating point noise (0.1 + 0.2 -> 0.3). */
function tidy(value: number): number {
  if (!Number.isFinite(value)) return value;
  // Only round while the scaled value stays exactly representable. Above this
  // magnitude, multiplying by 1e10 exceeds Number.MAX_SAFE_INTEGER and the
  // "cleanup" would itself introduce error (999999999999 -> 999999999999.0001).
  if (Math.abs(value) >= 1e6) return value;
  return Math.round(value * 1e10) / 1e10;
}

export function evaluate(input: string): CalcResult {
  const trimmed = input.trim();

  if (trimmed === "") return { ok: false, error: "Enter a calculation" };
  if (trimmed.length > MAX_EXPRESSION_LENGTH) {
    return { ok: false, error: "Calculation is too long" };
  }

  try {
    const value = evaluateTokens(tokenize(trimmed));
    assertFinite(value);
    return { ok: true, value: tidy(value) };
  } catch (error) {
    if (error instanceof ParseError) return { ok: false, error: error.message };
    return { ok: false, error: "Could not calculate" };
  }
}

/** Formats a number for the calculator display: groups thousands, drops trailing zeros. */
export function formatCalcValue(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const rounded = tidy(value);
  const [whole, fraction] = Math.abs(rounded).toString().split(".");
  const grouped = Number(whole).toLocaleString();
  const sign = rounded < 0 ? "-" : "";
  return fraction ? `${sign}${grouped}.${fraction}` : `${sign}${grouped}`;
}