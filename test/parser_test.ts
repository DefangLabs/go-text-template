import "mocha";
import { Template } from "../src";
import assert = require("assert");

describe("parser", function () {
  const template = new Template();

  describe("example from Go docs", function () {
    it("supports simple pipelines", function () {
      assert.strictEqual(
        template.execute(`
{{"\\"output\\""}}
  A string constant.
{{\`"output"\`}}
  A raw string constant.
{{print "output"}}
  A function call.
{{"output" | print}}
  A function call whose final argument comes from the previous
  command.
{{print (print "out" "put")}}
  A parenthesized argument.
{{"put" | print "out" | print}}
  A more elaborate call.
{{"output" | print | print}}
  A longer chain.`),
        `
"output"
  A string constant.
"output"
  A raw string constant.
output
  A function call.
output
  A function call whose final argument comes from the previous
  command.
output
  A parenthesized argument.
output
  A more elaborate call.
output
  A longer chain.`
      );
    });

    it("supports with scopes", function () {
      assert.strictEqual(
        template.execute(`
{{with "output"}}{{print .}}{{end}}
  A with action using dot.
{{with $x := "output" | print}}{{$x}}{{end}}
  A with action that creates and uses a variable.
{{with $x := "output"}}{{print $x}}{{end}}
  A with action that uses the variable in another action.
{{with $x := "output"}}{{$x | print}}{{end}}
  The same, but pipelined.`),
        `
output
  A with action using dot.
output
  A with action that creates and uses a variable.
output
  A with action that uses the variable in another action.
output
  The same, but pipelined.`
      );
    });
  });

  describe("data object", function () {
    it("supports member access", function () {
      assert.strictEqual(template.execute(`{{.x}}`, { x: "output" }), "output");
    });

    it("supports nested members", function () {
      assert.strictEqual(
        template.execute(`{{.x.y}}`, { x: { y: "output" } }),
        "output"
      );
    });
  });

  it("supports custom functions", function () {
    template.funcs.set("id", (arg: any, ...rest: any[]) => {
      assert.strictEqual(typeof arg, "string");
      assert.strictEqual(rest.length, 0);
      return arg;
    });
    template.funcs.set("add", (a: any, b: any, ...rest: any[]) => {
      assert.strictEqual(typeof a, "number");
      assert.strictEqual(typeof b, "number");
      assert.strictEqual(rest.length, 0);
      return a + b;
    });
    assert.strictEqual(template.execute(`{{id "output"}}`), "output");
    assert.strictEqual(template.execute(`{{add 2 3}}`), "5");
  });

  it("supports parantheses", function () {
    assert.strictEqual(template.execute(`{{(print "output")}}`), "output");
    assert.strictEqual(template.execute(`{{((print "output"))}}`), "output");
  });
});
