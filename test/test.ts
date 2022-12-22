import * as Mocha from "mocha";
import assert from "assert";
import { Command, ArgumentParser, NoHelp } from "../index";

Mocha.describe("Empty", () => {
  let params = new ArgumentParser(new NoHelp());

  it("Print modes", () => {
    assert.strictEqual(
      params.helpString(),
      "Specify which action you want help with:\n\n"
    );
  });
});

class DummyCommand implements Command {
  async execute() {}
}
class HelpMock<T> extends DummyCommand {
  constructor(public readonly arg: string, public readonly params: T) {
    super();
  }
}

Mocha.describe("Simple", () => {
  let params = new ArgumentParser(new NoHelp());
  params.push("help", {
    desc: "Prints help",
    arg: "command",
    construct: (act) => new HelpMock(act, undefined),
    flags: {},
  });

  it("Print modes", () => {
    assert.strictEqual(
      params.helpString(),
      "Specify which action you want help with:\n\n\thelp  Prints help\n"
    );
  });

  it("Print help for 'help'", () => {
    assert.strictEqual(
      params.helpString("help"),
      "Usage: help <command>\nPrints help\n\n"
    );
  });
});

class RepoMock extends DummyCommand {
  constructor(
    public readonly name: string,
    public readonly params: {
      private: boolean;
      ignore: string;
      license: string;
    }
  ) {
    super();
  }
}

Mocha.describe("Repo", () => {
  let params = new ArgumentParser(new NoHelp());
  params.push("repo", {
    desc: "Setup a new repository",
    arg: "name",
    construct: (arg, params) => new RepoMock(arg, params),
    flags: {
      private: {
        short: "p",
        desc: "Private repository",
        overrideValue: true,
        defaultValue: false,
      },
      ignore: {
        short: "i",
        desc: "Fetch standard .gitignore",
        arg: "language",
        overrideValue: (s) => s,
        defaultValue: "",
      },
      license: {
        desc: "Fetch standard license",
        arg: "license",
        overrideValue: (s) => s,
        defaultValue: "",
      },
    },
  });

  it("Help string", () => {
    let res = params.helpString();
    assert.strictEqual(
      res,
      `Specify which action you want help with:\n\n\trepo  Setup a new repository\n`
    );
  });

  it("Print help for 'repo'", () => {
    assert.strictEqual(
      params.helpString("repo"),
      "Usage: repo [--private] [--ignore <language>] [--license <license>] <name>\n" +
        "Setup a new repository\n" +
        "\n" +
        "  -p\t--private  Private repository\n" +
        "  -i\t--ignore   Fetch standard .gitignore\n" +
        "  \t--license  Fetch standard license\n"
    );
  });

  it("No argument", () => {
    assert.throws(
      () => params.parse(["repo"]),
      /^Missing required arguments: name$/
    );
  });

  it("Argument", () => {
    let res = params.parse(["repo", "five-lines"])[0] as RepoMock;
    assert.strictEqual(res.name, "five-lines");
    assert.deepStrictEqual(res.params, {
      private: false,
      ignore: "",
      license: "",
    });
  });

  it("Short flag", () => {
    let res = params.parse(["repo", "-p", "five-lines"])[0] as RepoMock;
    assert.strictEqual(res.name, "five-lines");
    assert.deepStrictEqual(res.params, {
      private: true,
      ignore: "",
      license: "",
    });
  });

  it("Long flag", () => {
    let res = params.parse(["repo", "--private", "five-lines"])[0] as RepoMock;
    assert.strictEqual(res.name, "five-lines");
    assert.deepStrictEqual(res.params, {
      private: true,
      ignore: "",
      license: "",
    });
  });

  it("Short flag with argument", () => {
    let res = params.parse([
      "repo",
      "-i",
      "javascript",
      "five-lines",
    ])[0] as RepoMock;
    assert.strictEqual(res.name, "five-lines");
    assert.deepStrictEqual(res.params, {
      private: false,
      ignore: "javascript",
      license: "",
    });
  });

  it("Long flag with argument", () => {
    let res = params.parse([
      "repo",
      "--ignore",
      "javascript",
      "five-lines",
    ])[0] as RepoMock;
    assert.strictEqual(res.name, "five-lines");
    assert.deepStrictEqual(res.params, {
      private: false,
      ignore: "javascript",
      license: "",
    });
  });

  it("Joining short flags with argument", () => {
    let res = params.parse([
      "repo",
      "-pi",
      "javascript",
      "five-lines",
    ])[0] as RepoMock;
    assert.strictEqual(res.name, "five-lines");
    assert.deepStrictEqual(res.params, {
      private: true,
      ignore: "javascript",
      license: "",
    });
  });

  it("Chaining modes without arguments", () => {
    let res = params.parse(["repo", "five-lines", "repo", "fib"]) as RepoMock[];
    assert.strictEqual(res[0].name, "five-lines");
    assert.strictEqual(res[1].name, "fib");
  });

  it("Chaining modes with argument", () => {
    let res = params.parse([
      "repo",
      "-p",
      "five-lines",
      "repo",
      "fib",
    ]) as RepoMock[];
    assert.strictEqual(res[0].name, "five-lines");
    assert.deepStrictEqual(res[0].params, {
      private: true,
      ignore: "",
      license: "",
    });
    assert.strictEqual(res[1].name, "fib");
    assert.deepStrictEqual(res[1].params, {
      private: false,
      ignore: "",
      license: "",
    });
  });
});

Mocha.describe("Required param", () => {
  let params = new ArgumentParser(new NoHelp());
  params.push("key", {
    desc: "key-value",
    arg: "key",
    construct: (act, params: { val: string; optional: string }) =>
      new HelpMock<{ val: string }>(act, params),
    flags: {
      val: {
        short: "v",
        arg: "value",
        overrideValue: (s) => s,
      },
      optional: {
        defaultValue: "nowhere",
        overrideValue: "here",
      },
    },
  });

  it("Print modes", () => {
    assert.strictEqual(
      params.helpString(),
      "Specify which action you want help with:\n\n\tkey  key-value\n"
    );
  });

  it("Print help for 'key'", () => {
    assert.strictEqual(
      params.helpString("key"),
      "Usage: key --val <value> [--optional] <key>\n" +
        "key-value\n" +
        "\n" +
        "  -v\t--val       \n" +
        "  \t--optional  \n"
    );
  });

  it("'key'", () => {
    let res = params.parse(["key", "thekey", "-v", "theval"])[0] as HelpMock<{
      val: string;
    }>;
    assert.strictEqual(res.arg, "thekey");
    assert.strictEqual(res.params.val, "theval");
  });

  it("Missing 'val'", () => {
    assert.throws(
      () => params.parse(["key", "thekey"]),
      /^Missing required arguments: val$/
    );
  });

  it("Missing 'value'", () => {
    assert.throws(
      () => params.parse(["key", "thekey", "-v"]),
      /^Missing required arguments: value$/
    );
  });
});
