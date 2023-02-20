"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Mocha = __importStar(require("mocha"));
const assert_1 = __importDefault(require("assert"));
const index_1 = require("../index");
Mocha.describe("Empty", () => {
    let params = new index_1.ArgumentParser(new index_1.NoHelp(), new index_1.NoContextHelp());
    it("Print modes", () => {
        assert_1.default.strictEqual(params.helpString(), "Specify which action you want help with:\n\n");
    });
});
class DummyCommand {
    async execute() { }
}
class HelpMock extends DummyCommand {
    constructor(arg, params) {
        super();
        this.arg = arg;
        this.params = params;
    }
}
Mocha.describe("Simple", () => {
    let params = new index_1.ArgumentParser(new index_1.NoHelp(), new index_1.NoContextHelp());
    params.push("help", {
        desc: "Prints help",
        arg: "command",
        construct: (act) => new HelpMock(act, undefined),
        flags: {},
    });
    it("Print modes", () => {
        assert_1.default.strictEqual(params.helpString(), "Specify which action you want help with:\n\n    help  Prints help\n");
    });
    it("Print help for 'help'", () => {
        assert_1.default.strictEqual(params.helpString("help"), "Usage: help <command>\nPrints help\n\n");
    });
});
class RepoMock extends DummyCommand {
    constructor(name, params) {
        super();
        this.name = name;
        this.params = params;
    }
}
Mocha.describe("Repo", () => {
    let params = new index_1.ArgumentParser(new index_1.NoHelp(), new index_1.NoContextHelp());
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
        assert_1.default.strictEqual(res, `Specify which action you want help with:\n\n    repo  Setup a new repository\n`);
    });
    it("Print help for 'repo'", () => {
        assert_1.default.strictEqual(params.helpString("repo"), "Usage: repo [--private] [--ignore <language>] [--license <license>] <name>\n" +
            "Setup a new repository\n" +
            "\n" +
            "  -p\t--private  Private repository\n" +
            "  -i\t--ignore   Fetch standard .gitignore\n" +
            "  \t--license  Fetch standard license\n");
    });
    it("No argument", () => {
        assert_1.default.throws(() => params.parse(["repo"]), /^Missing required arguments: name$/);
    });
    it("Argument", () => {
        let res = params.parse(["repo", "five-lines"])[0];
        assert_1.default.strictEqual(res.name, "five-lines");
        assert_1.default.deepStrictEqual(res.params, {
            private: false,
            ignore: "",
            license: "",
        });
    });
    it("Short flag", () => {
        let res = params.parse(["repo", "-p", "five-lines"])[0];
        assert_1.default.strictEqual(res.name, "five-lines");
        assert_1.default.deepStrictEqual(res.params, {
            private: true,
            ignore: "",
            license: "",
        });
    });
    it("Long flag", () => {
        let res = params.parse(["repo", "--private", "five-lines"])[0];
        assert_1.default.strictEqual(res.name, "five-lines");
        assert_1.default.deepStrictEqual(res.params, {
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
        ])[0];
        assert_1.default.strictEqual(res.name, "five-lines");
        assert_1.default.deepStrictEqual(res.params, {
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
        ])[0];
        assert_1.default.strictEqual(res.name, "five-lines");
        assert_1.default.deepStrictEqual(res.params, {
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
        ])[0];
        assert_1.default.strictEqual(res.name, "five-lines");
        assert_1.default.deepStrictEqual(res.params, {
            private: true,
            ignore: "javascript",
            license: "",
        });
    });
    it("Chaining modes without arguments", () => {
        let res = params.parse(["repo", "five-lines", "repo", "fib"]);
        assert_1.default.strictEqual(res[0].name, "five-lines");
        assert_1.default.strictEqual(res[1].name, "fib");
    });
    it("Chaining modes with argument", () => {
        let res = params.parse([
            "repo",
            "-p",
            "five-lines",
            "repo",
            "fib",
        ]);
        assert_1.default.strictEqual(res[0].name, "five-lines");
        assert_1.default.deepStrictEqual(res[0].params, {
            private: true,
            ignore: "",
            license: "",
        });
        assert_1.default.strictEqual(res[1].name, "fib");
        assert_1.default.deepStrictEqual(res[1].params, {
            private: false,
            ignore: "",
            license: "",
        });
    });
});
Mocha.describe("Required param", () => {
    let params = new index_1.ArgumentParser(new index_1.NoHelp(), new index_1.NoContextHelp());
    params.push("key", {
        desc: "key-value",
        arg: "key",
        construct: (act, params) => new HelpMock(act, params),
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
        assert_1.default.strictEqual(params.helpString(), "Specify which action you want help with:\n\n    key  key-value\n");
    });
    it("Print help for 'key'", () => {
        assert_1.default.strictEqual(params.helpString("key"), "Usage: key --val <value> [--optional] <key>\n" +
            "key-value\n" +
            "\n" +
            "  -v\t--val       \n" +
            "  \t--optional  \n");
    });
    it("'key'", () => {
        let res = params.parse(["key", "thekey", "-v", "theval"])[0];
        assert_1.default.strictEqual(res.arg, "thekey");
        assert_1.default.strictEqual(res.params.val, "theval");
    });
    it("Missing 'val'", () => {
        assert_1.default.throws(() => params.parse(["key", "thekey"]), /^Missing required arguments: val$/);
    });
    it("Missing 'value'", () => {
        assert_1.default.throws(() => params.parse(["key", "thekey", "-v"]), /^Missing required arguments: value$/);
    });
});
class MockContextHelp {
    toString() {
        return `\nYou're doing "great"\n`;
    }
}
Mocha.describe("General help", () => {
    let params = new index_1.ArgumentParser(new index_1.NoHelp(), new MockContextHelp());
    params.push("b", {
        desc: "B",
        construct: (act, params) => new DummyCommand(),
        flags: {},
    });
    params.push("d", {
        desc: "D",
        construct: (act, params) => new DummyCommand(),
        flags: {},
        isRelevant: () => false,
    });
    params.push("c", {
        desc: "C",
        construct: (act, params) => new DummyCommand(),
        flags: {},
    });
    params.push("a", {
        desc: "A",
        construct: (act, params) => new DummyCommand(),
        flags: {},
    });
    it("Print alphabetical (and relevant)", () => {
        assert_1.default.strictEqual(params.helpString(), 'Specify which action you want help with:\n\n    a  A\n    b  B\n    c  C\n\nActions that are probably less relevant:\n\n    d  D\n\nYou\'re doing "great"\n');
    });
});
Mocha.describe("Example", () => {
    let params = new index_1.ArgumentParser(new index_1.NoHelp(), new MockContextHelp());
    params.push("a", {
        desc: "A",
        construct: (act, params) => new DummyCommand(),
        flags: {},
        example: "a",
    });
    params.push("b", {
        construct: (act, params) => new DummyCommand(),
        flags: {},
        example: "b",
    });
    it("A example", () => {
        assert_1.default.strictEqual(params.helpString("a"), "Usage: a\nA\n\nExample: a\n\n");
    });
    it("B example", () => {
        assert_1.default.strictEqual(params.helpString("b"), "Usage: b\n\nExample: b\n\n");
    });
});
