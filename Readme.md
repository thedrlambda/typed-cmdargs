# typed-cmdargs

Small library for parsing command line arguments for `git` style tools. 

The strength is the type safety and architecture it supports.

## How to install

```
npm install typed-cmdargs
```

## Example

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
