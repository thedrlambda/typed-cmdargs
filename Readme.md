# typed-cmdargs

Small library for parsing command line arguments for `git` style tools. 

The strength is the type safety and architecture it supports.

## How to install

```
npm install typed-cmdargs
```

## Example

Helper classes:

```
interface IgnoreAction {
  act(): void;
}
class DownloadIgnore implement IgnoreAction {
  constructor(private language: string) { }
  act() { ... }
}
class DoNothing implement IgnoreAction {
  act() { }
}

class Repo implements Command {
  constructor(
    private name: string, 
    private flags: { private: boolean, ignore: IgnoreAction }) { }
  execute() { 
    ...
    flags.ignore.act();
    ...
  }
}
```

Configuring the parser:

```
let params = new ArgumentParser();
params.push("repo", {
  desc: "Setup a new repository",
  arg: "name",
  construct: (arg, params) => new Repo(arg, params),
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
      overrideValue: (s) => new DownloadIgnore(s),
      defaultValue: new DoNothing(),
    },
  },
});
```

Template for calling it:

```
if (process.argv[0].endsWith("node.exe")) process.argv.splice(0, 1);
process.argv.splice(0, 1);
if (process.argv[0] === "help") {
  console.log(argParser.helpString(process.argv[1]));
} else {
  let cmds = argParser.parse(process.argv);
  cmds.forEach((cmd) => cmd.execute());
}
```

## How to use

For tutorial see my blog post on Medium: [https://medium.com/@thedrlambda/cli-architecture-in-nodejs-852e95773403](https://medium.com/@thedrlambda/cli-architecture-in-nodejs-852e95773403?sk=31950050bc8f1f36597f384527212214)

## How to test

```
npm test
```

## How to contribute

Make sure the tests are passing, then just send me a pull request. 

_Notice_: I only want `dev` dependencies.
