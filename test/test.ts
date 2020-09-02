import * as Mocha from "mocha";
import assert from "assert";
import { Command, ArgumentParser } from "../index";

Mocha.describe("Empty", () => {
  let params = new ArgumentParser();

  it("Print modes", () => {
    assert.equal(
      params.helpString(),
      "Specify which action you want help with:\n\n"
    );
  });
});

class DummyCommand implements Command {
  execute() {}
}
class HelpMock extends DummyCommand {
  constructor(public readonly action: string) {
    super();
  }
}

Mocha.describe("Simple", () => {
  let params = new ArgumentParser();
  params.push("help", {
    desc: "Prints help",
    arg: "command",
    construct: (act: string) => new HelpMock(act),
    flags: {},
  });

  it("Print modes", () => {
    assert.equal(
      params.helpString(),
      "Specify which action you want help with:\n\n\thelp  Prints help\n"
    );
  });

  it("Print help for 'help'", () => {
    assert.equal(
      params.helpString("help"),
      "Usage: help <command>\nPrints help\n\n"
    );
  });

  it("'help'", () => {
    let res = params.parse(["help"])[0] as HelpMock;
    assert.equal(res.action, undefined);
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
  let params = new ArgumentParser();
  params.push("repo", {
    desc: "Setup a new repository",
    construct: (arg: string, params) => new RepoMock(arg, params),
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

  it("Argument", () => {
    let res = params.parse(["repo", "five-lines"])[0] as RepoMock;
    assert.equal(res.name, "five-lines");
    assert.deepEqual(res.params, { private: false, ignore: "", license: "" });
  });

  it("Short flag", () => {
    let res = params.parse(["repo", "-p", "five-lines"])[0] as RepoMock;
    assert.equal(res.name, "five-lines");
    assert.deepEqual(res.params, { private: true, ignore: "", license: "" });
  });

  it("Long flag", () => {
    let res = params.parse(["repo", "--private", "five-lines"])[0] as RepoMock;
    assert.equal(res.name, "five-lines");
    assert.deepEqual(res.params, { private: true, ignore: "", license: "" });
  });

  it("Short flag with argument", () => {
    let res = params.parse([
      "repo",
      "-i",
      "javascript",
      "five-lines",
    ])[0] as RepoMock;
    assert.equal(res.name, "five-lines");
    assert.deepEqual(res.params, {
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
    assert.equal(res.name, "five-lines");
    assert.deepEqual(res.params, {
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
    assert.equal(res.name, "five-lines");
    assert.deepEqual(res.params, {
      private: true,
      ignore: "javascript",
      license: "",
    });
  });

  it("Chaining modes without arguments", () => {
    let res = params.parse(["repo", "five-lines", "repo", "fib"]) as RepoMock[];
    assert.equal(res[0].name, "five-lines");
    assert.equal(res[1].name, "fib");
  });

  it("Chaining modes with argument", () => {
    let res = params.parse([
      "repo",
      "-p",
      "five-lines",
      "repo",
      "fib",
    ]) as RepoMock[];
    assert.equal(res[0].name, "five-lines");
    assert.deepEqual(res[0].params, {
      private: true,
      ignore: "",
      license: "",
    });
    assert.equal(res[1].name, "fib");
    assert.deepEqual(res[1].params, {
      private: false,
      ignore: "",
      license: "",
    });
  });
});
