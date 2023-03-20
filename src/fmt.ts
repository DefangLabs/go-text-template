import assert = require("assert");

type FmtFlag = "-" | "+" | "#" | "0" | " ";
type FmtFlags = FmtFlag[];
type FmtVerb =
  | "v"
  | "T"
  | "%"
  | "t"
  | "b"
  | "c"
  | "d"
  | "o"
  | "O"
  | "q"
  | "x"
  | "X"
  | "U"
  | "e"
  | "E"
  | "f"
  | "F"
  | "g"
  | "G"
  | "s"
  | "p";

function fmtNumber(
  flags: FmtFlags,
  prec: number,
  verb: FmtVerb,
  value: number
): string | undefined {
  const alt = flags.includes("#");
  let prefix = flags.includes("+") ? "+" : flags.includes(" ") ? " " : "";
  if (value < 0) {
    value = -value;
    prefix = "-";
  }
  switch (verb) {
    case "T":
      return "float64";
    case "b":
      return prefix + (alt ? "0b" : "") + value.toString(2); // TODO: support floats
    case "c": // TODO: only for integers
      return String.fromCharCode(value);
    case "d": // TODO: only for integers
      return prefix + value;
    case "o": // TODO: only for integers
      return prefix + (alt ? "0" : "") + value.toString(8);
    case "O": // TODO: only for integers
      return prefix + "0o" + value.toString(8);
    case "q": // TODO: only for integers
      return `'${String.fromCodePoint(value)}'`;
    case "x": // TODO: only for integers
      return prefix + (alt ? "0x" : "") + value.toString(16);
    case "X": // TODO: only for integers
      return prefix + (alt ? "0X" : "") + value.toString(16).toUpperCase();
    case "U": // TODO: only for integers
      return "U+" + value.toString(16).toUpperCase().padStart(4, "0");
    case "e": // TODO: only for floats
      return prefix + value.toExponential(prec);
    case "E": // TODO: only for floats
      return prefix + value.toExponential(prec).toUpperCase();
    case "f": // TODO: only for floats
    case "F": // alias for 'f'
      return prefix + value.toFixed(prec);
    case "v":
    case "g": // TODO: only for floats
      return prefix + value.toPrecision(prec);
    case "G": // TODO: only for floats
      return prefix + value.toPrecision(prec).toUpperCase();
  }
  return undefined;
}

function fmtBool(verb: FmtVerb, value: boolean): string | undefined {
  switch (verb) {
    case "T":
      return "bool";
    case "v":
    case "t":
      return value ? "true" : "false";
  }
  return undefined;
}

assert.strictEqual(fmtBool("v", true), "true");
assert.strictEqual(fmtBool("v", false), "false");
assert.strictEqual(fmtBool("t", false), "false");
assert.strictEqual(fmtBool("t", true), "true");
assert.strictEqual(fmtBool("T", false), "bool");
assert.strictEqual(fmtBool("x", false), undefined);

function toHexString(value: string, sep: string): string {
  return value
    .split("")
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
    .join(sep);
}

assert.strictEqual(toHexString("abc", " "), "61 62 63");
assert.strictEqual(toHexString("\x01\x02", ""), "0102");

function fmtString(
  flags: FmtFlags,
  verb: FmtVerb,
  value: string
): string | undefined {
  const prefix = flags.includes("#") ? "0x" : "";
  const sep = flags.includes(" ") ? " " + prefix : "";
  switch (verb) {
    case "T":
      return "string";
    case "v":
    case "s":
      return value;
    case "q":
      return JSON.stringify(value);
    case "x":
      return prefix + toHexString(value, sep);
    case "X":
      return prefix + toHexString(value, sep).toUpperCase();
  }
  return undefined;
}

assert.strictEqual(fmtString(["#"], "x", "abc"), "0x61 0x62 0x63");

function fmtArg(
  flags: FmtFlag[],
  prec: number,
  verb: FmtVerb,
  value: unknown
): string | undefined {
  assert.notEqual(verb, "%");
  switch (typeof value) {
    case "number":
      return fmtNumber(flags, prec, verb, value);
    case "boolean":
      return fmtBool(verb, value);
    case "string":
      return fmtString(flags, verb, value);
    case "object":
      assert.strictEqual(value, null);
      switch (verb) {
        case "v":
        case "T":
          return "<nil>";
      }
  }
  return undefined;
}

function asNumber(value: unknown): number {
  assert(typeof value === "number");
  // enforce(typeof value === "number", `expected number; found ${value}`);
  return value;
}

function parseArg(
  arg: string,
  values: unknown[],
  state: { index: number }
): number {
  switch (arg[0]) {
    case "*":
      return asNumber(values[state.index++]);
    case "[":
      return asNumber(values[parseInt(arg.slice(1))]);
    case undefined:
      return 0;
    default:
      return parseInt(arg);
  }
}

assert.strictEqual(parseArg("", [1, 2, 3], { index: 0 }), 0);
assert.strictEqual(parseArg("4", [1, 2, 3], { index: 0 }), 4);
assert.strictEqual(parseArg("*", [1, 2, 3], { index: 0 }), 1);
assert.strictEqual(parseArg("*", [1, 2, 3], { index: 1 }), 2);
assert.strictEqual(parseArg("[2]*", [4, 5, 6], { index: 0 }), 5);

const FMT_REGEX =
  /%([-+# 0]*)((?:\[\d+\])?\*|\d*)(?:\.((?:\[\d+\])?\*|\d*))?(?:\[(\d+)\])?(.?)/g;

// Sprintf functions that follows the rules of Go's fmt package, cf. https://pkg.go.dev/fmt
export function sprintf(format: string, ...values: unknown[]): string {
  const state = { index: 0 };
  const str = format.replace(
    FMT_REGEX,
    (
      _,
      flags: FmtFlags,
      width: string,
      prec: string,
      verbArg: string,
      verb: FmtVerb | ""
    ) => {
      let result = "";
      const w = parseArg(width, values, state); // TODO: implement width
      const p = parseArg(prec, values, state);
      if (verb === "") {
        return "%!(NOVERB)";
      }
      if (verbArg) state.index = parseInt(verbArg);
      const value = values[state.index++];
      const arg = fmtArg(flags, p, verb, value);
      if (arg === undefined) {
        result += "%!(BADVERB)";
      }
      return result;
    }
  );
  return str; // TODO: add `%!(EXTRA …)` args
}

assert.strictEqual(sprintf("%v", 42), "42");
assert.strictEqual(sprintf("%v", "foo"), "foo");
assert.strictEqual(sprintf("%v", true), "true");
assert.strictEqual(sprintf("%v", null), "<nil>");
// assert.strictEqual(sprintf("%v", undefined), "%!v(MISSING)");
// assert.strictEqual(sprintf("%v", [1, 2, 3]), "[1,2,3]");
// assert.strictEqual(sprintf("%v", { foo: 42 }), "{foo:42}");
// assert.strictEqual(sprintf("%v", /foo/), "/foo/");
