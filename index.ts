interface Command {}
class Repo implements Command {
  constructor(private params: any, private name: string) {}
}

type t<T, A> = {
  desc: string;
  arg?: A;
  con: (params: T, arg: A) => Command;
  args: {
    [k in keyof T]: {
      short?: string;
      desc: string;
      falseVal: T[k];
    } & (
      | {
          arg?: undefined;
          trueVal: T[k];
        }
      | {
          arg: string;
          trueVal: (arg: string) => T[k];
        }
    );
  };
};

class Params {
  private modes: { [mode: string]: t<any, any> } = {};
  push<T, A>(name: string, mode: t<T, A>) {
    this.modes[name] = mode;
    return this;
  }
  parse(strings: string[]) {
    let current = [];
    let mode = this.modes[strings[0]];
    let args = mode.args;
    let result: { [k: string]: any } = {};
    Object.keys(args).forEach((k: string) => {
      result[k] = args[k].falseVal;
    });
    let arg: undefined | string = undefined;
    for (let i = 1; i < strings.length; i++) {
      let p = strings[i];
      if (this.modes[strings[i]]) {
        current.push(mode.con(result, arg));
        mode = this.modes[strings[i]];
        args = mode.args;
        result = {};
        Object.keys(args).forEach((k: string) => {
          result[k] = args[k].falseVal;
        });
        arg = undefined;
      } else if (p.startsWith("--")) {
        let k = p.substring("--".length);
        if (args[k].arg) {
          result[k] = args[k].trueVal(strings[++i]);
        } else {
          result[k] = args[k].trueVal;
        }
      } else if (p.startsWith("-")) {
        let ps = p.split("");
        for (let j = 1; j < ps.length; j++) {
          Object.keys(args).forEach((k: string) => {
            if (ps[j] === args[k].short)
              if (args[k].arg) {
                result[k] = args[k].trueVal(strings[++i]);
              } else {
                result[k] = args[k].trueVal;
              }
          });
        }
      } else {
        arg = strings[i];
      }
    }
    current.push(mode.con(result, arg));
    return current;
  }
  printHelp(mode?: string) {
    if (mode) {
      let result = `Usage: ${mode}`;
      let cmd = this.modes[mode];
      let options = cmd.args;
      Object.keys(options).forEach((k) => {
        result += ` [--${k}${options[k].arg ? ` <${options[k].arg}>` : ""}]`;
      });
      result += cmd.arg ? ` <${cmd.arg}>` : "";
      result += "\n";
      if (cmd.desc) result += cmd.desc + "\n";
      result += "\n";
      let width = 0;
      Object.keys(options).forEach((k) => {
        width = Math.max(width, k.length);
      });
      Object.keys(options).forEach((k) => {
        result += `  ${
          options[k].short ? `-${options[k].short}` : ""
        }\t${`--${k}`.padEnd(width + 4)}${options[k].desc}\n`;
      });
      return result;
    } else {
      let result = "Specify which action you want help with:\n";
      result += "\n";
      let width = 0;
      Object.keys(this.modes).forEach((m) => {
        width = Math.max(width, m.length);
      });
      Object.keys(this.modes).forEach((m) => {
        result += `\t${m.padEnd(width + 2)}${this.modes[m].desc}\n`;
      });
      return result;
    }
  }
}

let par = new Params();
par.push("repo", {
  desc: "Setup a new repository",
  con: (params, arg: string) => new Repo(params, arg),
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

console.log(par.parse(["repo", "five-lines"]));
console.log(par.parse(["repo", "--private", "five-lines"]));
console.log(par.parse(["repo", "-p", "five-lines"]));
console.log(par.parse(["repo", "-i", "javascript", "five-lines"]));
console.log(par.parse(["repo", "--ignore", "javascript", "five-lines"]));
console.log(par.parse(["repo", "-pi", "javascript", "five-lines"]));
console.log(par.parse(["repo", "five-lines", "repo", "fib"]));

console.log(par.printHelp("repo"));
console.log(par.printHelp());
