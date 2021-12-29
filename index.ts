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
    } & (
      | {
          arg?: undefined;
          defaultValue: T[k];
          overrideValue: T[k];
        }
      | {
          arg: string;
          defaultValue: T[k];
          overrideValue: (arg: string) => T[k];
        }
      | {
          arg: string;
          defaultValue?: undefined;
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
    let required = new Set<string>();
    Object.keys(args).forEach((k: string) => {
      if (args[k].defaultValue === undefined) required.add(k);
      else result[k] = args[k].defaultValue;
    });
    let arg: undefined | string = undefined;
    for (let i = 1; i < strings.length; i++) {
      let p = strings[i];
      if (this.modes[strings[i]]) {
        if (required.size > 0) {
          let out = "";
          required.forEach((k) => {
            if (out.length > 0) out += ", ";
            out += k;
          });
          throw `Missing required arguments: ${out}`;
        }
        current.push(mode.construct(arg, result));
        mode = this.modes[strings[i]];
        args = mode.flags;
        result = {};
        required.clear();
        Object.keys(args).forEach((k: string) => {
          if (args[k].defaultValue === undefined) required.add(k);
          else result[k] = args[k].defaultValue;
        });
        arg = undefined;
      } else if (p.startsWith("--")) {
        let k = p.substring("--".length);
        required.delete(k);
        if (args[k].arg !== undefined) {
          result[k] = args[k].overrideValue(strings[++i]);
        } else {
          result[k] = args[k].overrideValue;
        }
      } else if (p.startsWith("-")) {
        let ps = p.split("");
        for (let j = 1; j < ps.length; j++) {
          Object.keys(args).forEach((k: string) => {
            if (ps[j] === args[k].short) {
              required.delete(k);
              if (args[k].arg) {
                result[k] = args[k].overrideValue(strings[++i]);
              } else {
                result[k] = args[k].overrideValue;
              }
            }
          });
        }
      } else {
        arg = strings[i];
      }
    }
    if (required.size > 0) {
      let out = "";
      required.forEach((k) => {
        if (out.length > 0) out += ", ";
        out += k;
      });
      throw `Missing required arguments: ${out}`;
    }
    current.push(mode.construct(arg, result));
    return current;
  }
  helpString(mode?: string) {
    if (mode && this.modes[mode] !== undefined) {
      let cmd = this.modes[mode];
      let options = cmd.flags;
      // Usage part
      let result = `Usage: ${mode}`;
      let optional = ``;
      let required = ``;
      Object.keys(options).forEach((k) => {
        if (options[k].defaultValue === undefined)
          required += ` --${k}${options[k].arg ? ` <${options[k].arg}>` : ""}`;
        else
          optional += ` [--${k}${
            options[k].arg ? ` <${options[k].arg}>` : ""
          }]`;
      });
      result += required;
      result += optional;
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
        }\t${`--${k}`.padEnd(width + 4)}${options[k].desc || ""}\n`;
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
