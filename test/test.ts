import * as Mocha from "mocha";
import assert from "assert";
import { Command, Params } from "../index";

Mocha.describe("Empty", () => {
  let params = new Params();

  it("Print modes", () => {
    assert.equal(
      params.printHelp(),
      "Specify which action you want help with:\n\n"
    );
  });
});

class HelpMock implements Command {
  constructor(public readonly action: string) {}
}

Mocha.describe("Simple", () => {
  let params = new Params();
  params.push("help", {
    desc: "Prints help",
    arg: "command",
    construct: (act: string) => new HelpMock(act),
    args: {},
  });

  it("Print modes", () => {
    assert.equal(
      params.printHelp(),
      "Specify which action you want help with:\n\n\thelp  Prints help\n"
    );
  });

  it("Print help for 'help'", () => {
    assert.equal(
      params.printHelp("help"),
      "Usage: help <command>\nPrints help\n\n"
    );
  });

  it("'help'", () => {
    let res = params.parse(["help"])[0] as HelpMock;
    assert.equal(res.action, undefined);
  });
});

class RepoMock implements Command {
  constructor(
    public readonly name: string,
    public readonly params: {
      private: boolean;
      ignore: string;
      license: string;
    }
  ) {}
}

Mocha.describe("Repo", () => {
  let params = new Params();
  params.push("repo", {
    desc: "Setup a new repository",
    construct: (arg: string, params) => new RepoMock(arg, params),
    args: {
      private: {
        short: "p",
        desc: "Private repository",
        trueVal: true,
        falseVal: false,
      },
      ignore: {
        short: "i",
        desc: "Fetch standard .gitignore",
        arg: "language",
        trueVal: (s) => s,
        falseVal: "",
      },
      license: {
        desc: "Fetch standard license",
        arg: "license",
        trueVal: (s) => s,
        falseVal: "",
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
