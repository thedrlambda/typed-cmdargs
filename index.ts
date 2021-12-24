export interface Command {
  execute(): Promise<void>;
}

type t<T, A> = {
  desc?: string;
  arg?: A;
  construct: (arg: A, params: T) => Command;
  flags: {
    [k in keyof T]: {
      short?: string;
      desc?: string;
      defaultValue: T[k];
    } & (
      | {
          arg?: undefined;
          overrideValue: T[k];
        }
      | {
          arg: string;
          overrideValue: (arg: string) => T[k];
        }
    );
  };
};

function maxKeyWidth(obj: { [key: string]: any }) {
  let width = 0;
  Object.keys(obj).forEach((k) => {
    width = Math.max(width, k.length);
  });
  return width;
}

export class ArgumentParser {
  private modes: { [mode: string]: t<any, any> } = {};
  push<T, A>(name: string, mode: t<T, A>) {
    this.modes[name] = mode;
    return this;
  }
  parse(strings: string[]) {
    let current = [];
    let mode = this.modes[strings[0]];
    if (mode === undefined) {
      throw `Unknown command '${strings[0]}'.`;
    }
    let args = mode.flags;
    let result: { [k: string]: any } = {};
    Object.keys(args).forEach((k: string) => {
      result[k] = args[k].defaultValue;
    });
    let arg: undefined | string = undefined;
    for (let i = 1; i < strings.length; i++) {
      let p = strings[i];
      if (this.modes[strings[i]]) {
        current.push(mode.construct(arg, result));
        mode = this.modes[strings[i]];
        args = mode.flags;
        result = {};
        Object.keys(args).forEach((k: string) => {
          result[k] = args[k].defaultValue;
        });
        arg = undefined;
      } else if (p.startsWith("--")) {
        let k = p.substring("--".length);
        if (args[k].arg) {
          result[k] = args[k].overrideValue(strings[++i]);
        } else {
          result[k] = args[k].overrideValue;
        }
      } else if (p.startsWith("-")) {
        let ps = p.split("");
        for (let j = 1; j < ps.length; j++) {
          Object.keys(args).forEach((k: string) => {
            if (ps[j] === args[k].short)
              if (args[k].arg) {
                result[k] = args[k].overrideValue(strings[++i]);
              } else {
                result[k] = args[k].overrideValue;
              }
          });
        }
      } else {
        arg = strings[i];
      }
    }
    current.push(mode.construct(arg, result));
    return current;
  }
  helpString(mode?: string) {
    if (mode) {
      let cmd = this.modes[mode];
      let options = cmd.flags;
      // Usage part
      let result = `Usage: ${mode}`;
      Object.keys(options).forEach((k) => {
        result += ` [--${k}${options[k].arg ? ` <${options[k].arg}>` : ""}]`;
      });
      result += cmd.arg ? ` <${cmd.arg}>` : "";
      result += "\n";
      // Description part
      if (cmd.desc) result += cmd.desc + "\n";
      result += "\n";
      // Arguments part
      let width = maxKeyWidth(options);
      Object.keys(options).forEach((k) => {
        result += `  ${
          options[k].short ? `-${options[k].short}` : ""
        }\t${`--${k}`.padEnd(width + 4)}${options[k].desc}\n`;
      });
      return result;
    } else {
      let result = "Specify which action you want help with:\n";
      result += "\n";
      let width = maxKeyWidth(this.modes);
      Object.keys(this.modes).forEach((m) => {
        result += `\t${m.padEnd(width + 2)}${this.modes[m].desc}\n`;
      });
      return result;
    }
  }
}
