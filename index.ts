export interface Command {
  execute(): Promise<void>;
}

type t<T, A> = {
  desc?: string;
  example?: string;
  arg?: A;
  construct: (arg: A, params: T) => Command;
  isRelevant?: () => boolean;
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

export interface HelpArgumentText {
  help(command: string): string;
}
export class NoHelp implements HelpArgumentText {
  help(command: string) {
    return `Unknown argument: help`;
  }
}

export interface ContextHelpText {
  toString(): string;
}
export class NoContextHelp implements ContextHelpText {
  toString() {
    return ``;
  }
}

export class ArgumentParser {
  private modes: { [mode: string]: t<any, any> } = {};
  constructor(
    private helpArgument: HelpArgumentText,
    private contextHelp: ContextHelpText
  ) {}
  push<T, A>(name: string, mode: t<T, A>) {
    this.modes[name] = mode;
    return this;
  }
  parse(strings: string[]) {
    let current = [];
    let command = strings[0];
    let mode = this.modes[command];
    if (mode === undefined) {
      throw `Unknown command: ${command}`;
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
          throw (
            `Missing required arguments: ${out}` +
            (mode.example !== undefined
              ? `\nExample usage: ${mode.example}`
              : "")
          );
        }
        if (arg === undefined && mode.arg !== undefined)
          throw (
            `Missing required arguments: ${mode.arg}` +
            (mode.example !== undefined
              ? `\nExample usage: ${mode.example}`
              : "")
          );
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
        if (args[k] === undefined) {
          if (k === "help") {
            throw this.helpArgument.help(command);
          } else {
            throw (
              `Unknown argument: ${k}` +
              (mode.example !== undefined
                ? `\nExample usage: ${mode.example}`
                : "")
            );
          }
        } else {
          let argName = args[k].arg;
          if (argName !== undefined) {
            if (i + 1 >= strings.length) required.add(argName);
            else result[k] = args[k].overrideValue(strings[++i]);
          } else {
            result[k] = args[k].overrideValue;
          }
        }
      } else if (p.startsWith("-")) {
        let ps = p.split("");
        for (let j = 1; j < ps.length; j++) {
          let found = false;
          Object.keys(args).forEach((k: string) => {
            if (ps[j] === args[k].short) {
              found = true;
              required.delete(k);
              let argName = args[k].arg;
              if (argName !== undefined) {
                if (i + 1 >= strings.length) required.add(argName);
                else result[k] = args[k].overrideValue(strings[++i]);
              } else {
                result[k] = args[k].overrideValue;
              }
            }
          });
          if (!found) {
            throw (
              `Unknown argument: ${ps[j]}` +
              (mode.example !== undefined
                ? `\nExample usage: ${mode.example}`
                : "")
            );
          }
        }
      } else if (arg === undefined || p.length > 0) {
        arg = strings[i];
      }
    }
    if (required.size > 0) {
      let out = "";
      required.forEach((k) => {
        if (out.length > 0) out += ", ";
        out += k;
      });
      throw (
        `Missing required arguments: ${out}` +
        (mode.example !== undefined ? `\nExample usage: ${mode.example}` : "")
      );
    }
    if (arg === undefined && mode.arg !== undefined)
      throw (
        `Missing required arguments: ${mode.arg}` +
        (mode.example !== undefined ? `\nExample usage: ${mode.example}` : "")
      );
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
      if (cmd.example) result += `\nExample: ` + cmd.example + "\n";
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
      let lessRelevant = "";
      Object.keys(this.modes)
        .sort()
        .forEach((m) => {
          let r = this.modes[m].isRelevant;
          if (r === undefined || r())
            result += `    ${m.padEnd(width + 2)}${this.modes[m].desc}\n`;
          else
            lessRelevant += `    ${m.padEnd(width + 2)}${this.modes[m].desc}\n`;
        });
      if (lessRelevant !== "")
        result +=
          "\nActions that are probably less relevant:\n\n" + lessRelevant;
      return result + this.contextHelp.toString();
    }
  }
}
