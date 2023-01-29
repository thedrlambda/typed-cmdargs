"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArgumentParser = exports.NoContextHelp = exports.NoHelp = void 0;
function maxKeyWidth(obj) {
    let width = 0;
    Object.keys(obj).forEach((k) => {
        width = Math.max(width, k.length);
    });
    return width;
}
class NoHelp {
    help(command) {
        return `Unknown argument: help`;
    }
}
exports.NoHelp = NoHelp;
class NoContextHelp {
    toString() {
        return ``;
    }
}
exports.NoContextHelp = NoContextHelp;
class ArgumentParser {
    constructor(helpArgument, contextHelp) {
        this.helpArgument = helpArgument;
        this.contextHelp = contextHelp;
        this.modes = {};
    }
    push(name, mode) {
        this.modes[name] = mode;
        return this;
    }
    parse(strings) {
        let current = [];
        let command = strings[0];
        let mode = this.modes[command];
        if (mode === undefined) {
            throw `Unknown command '${command}'.`;
        }
        let args = mode.flags;
        let result = {};
        let required = new Set();
        Object.keys(args).forEach((k) => {
            if (args[k].defaultValue === undefined)
                required.add(k);
            else
                result[k] = args[k].defaultValue;
        });
        let arg = undefined;
        for (let i = 1; i < strings.length; i++) {
            let p = strings[i];
            if (this.modes[strings[i]]) {
                if (required.size > 0) {
                    let out = "";
                    required.forEach((k) => {
                        if (out.length > 0)
                            out += ", ";
                        out += k;
                    });
                    throw `Missing required arguments: ${out}`;
                }
                if (arg === undefined && mode.arg !== undefined)
                    throw `Missing required arguments: ${mode.arg}`;
                current.push(mode.construct(arg, result));
                mode = this.modes[strings[i]];
                args = mode.flags;
                result = {};
                required.clear();
                Object.keys(args).forEach((k) => {
                    if (args[k].defaultValue === undefined)
                        required.add(k);
                    else
                        result[k] = args[k].defaultValue;
                });
                arg = undefined;
            }
            else if (p.startsWith("--")) {
                let k = p.substring("--".length);
                required.delete(k);
                if (args[k] === undefined) {
                    if (k === "help") {
                        throw this.helpArgument.help(command);
                    }
                    else {
                        throw `Unknown argument: ${k}`;
                    }
                }
                else {
                    let argName = args[k].arg;
                    if (argName !== undefined) {
                        if (i + 1 >= strings.length)
                            required.add(argName);
                        else
                            result[k] = args[k].overrideValue(strings[++i]);
                    }
                    else {
                        result[k] = args[k].overrideValue;
                    }
                }
            }
            else if (p.startsWith("-")) {
                let ps = p.split("");
                for (let j = 1; j < ps.length; j++) {
                    Object.keys(args).forEach((k) => {
                        if (ps[j] === args[k].short) {
                            required.delete(k);
                            let argName = args[k].arg;
                            if (argName !== undefined) {
                                if (i + 1 >= strings.length)
                                    required.add(argName);
                                else
                                    result[k] = args[k].overrideValue(strings[++i]);
                            }
                            else {
                                result[k] = args[k].overrideValue;
                            }
                        }
                    });
                }
            }
            else if (p.length > 0) {
                arg = strings[i];
            }
        }
        if (required.size > 0) {
            let out = "";
            required.forEach((k) => {
                if (out.length > 0)
                    out += ", ";
                out += k;
            });
            throw `Missing required arguments: ${out}`;
        }
        if (arg === undefined && mode.arg !== undefined)
            throw `Missing required arguments: ${mode.arg}`;
        current.push(mode.construct(arg, result));
        return current;
    }
    helpString(mode) {
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
                    optional += ` [--${k}${options[k].arg ? ` <${options[k].arg}>` : ""}]`;
            });
            result += required;
            result += optional;
            result += cmd.arg ? ` <${cmd.arg}>` : "";
            result += "\n";
            // Description part
            if (cmd.desc)
                result += cmd.desc + "\n";
            result += "\n";
            // Arguments part
            let width = maxKeyWidth(options);
            Object.keys(options).forEach((k) => {
                result += `  ${options[k].short ? `-${options[k].short}` : ""}\t${`--${k}`.padEnd(width + 4)}${options[k].desc || ""}\n`;
            });
            return result;
        }
        else {
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
exports.ArgumentParser = ArgumentParser;
