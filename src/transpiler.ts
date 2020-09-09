import { Parser, Scope, Statement } from "./parser.ts";
import { LexerGrammar } from "./types.ts";
import * as Path from "https://deno.land/std@0.65.0/path/mod.ts";
import { TSCError } from "./errors.ts";

export class Transpiler {
  ast: Scope;
  grammar: LexerGrammar;
  filepath: string;

  isTop: boolean;

  mainIndex: number;
  code: string;

  constructor(parser: Parser) {
    this.ast = parser.ast;
    this.grammar = parser.grammar;
    this.filepath = parser.filepath;

    this.isTop = true;

    this.code = "";
    this.mainIndex = 0;
  }

  async defineLib(filepath: string) {
    const fullpath = Path.resolve(filepath);
    const data = new TextDecoder("utf8").decode(await Deno.readFile(fullpath));

    this.code += data + "\n\n\n";
  }

  createMain() {
    this.mainIndex = (this.code.length >= 1) ? this.code.length-1 : 0;
    this.code += `int main(int argc, char** argv) {\n`;
    // this.code += `int main(int argc, char** argv) {\n  std::chrono::steady_clock::time_point CPPTIMERBEGIN = std::chrono::steady_clock::now();\n`;
  }

  insertBeforeMain(code: string) {
    this.code = this.code.slice(0, this.mainIndex) + code + "\n" + this.code.slice(this.mainIndex);

    this.mainIndex += code.length + 1;
  };

  getCType(type: string) {
    switch (type) {
      case "number":
        return "TSNumber";
      case "string":
        return "std::string";
      case "boolean":
        return "bool";
      case "void":
        return "void";
      default:
        return type;
    }
  }

  createVar(exp: Statement) {
    const varName = exp.value.name.value;
    const dataType = this.getCType(exp.value.dataType.value);
    const isConst = exp.value.isConst;

    if (isConst) this.code += "const ";
    this.code += `${dataType} ${varName}`;
  }

  createFunction(exp: Statement) {
    let code = "";
    const dataType = this.getCType(exp.value.dataType.value);
    const funcName = exp.value.name.value;
    const parameters = exp.value.parameters;
    const scope = exp.value.scope;

    code += `${dataType} ${funcName}(`;
    const codeLength = this.code.length;
    const oldCode = this.code;
    let first = true;

    parameters.forEach((expr: any) => {
      if (first) {
        first = false;
      } else {
        code += ", ";
      }
      this.transpile(expr);

      code += this.code.slice(codeLength);
      this.code = oldCode;
    });

    code += ") ";

    this.transpile(scope);
    code += this.code.slice(codeLength);
    this.code = oldCode;

    this.insertBeforeMain(code);
  }

  createStruct(exp: Statement) {
    if (exp.type != "Interface") new TSCError(`Expected an interface but got '${exp.type}'`);
    const interfaceName = exp.value.name.value;

    let code = `struct ${interfaceName}_INTERFACE {\n`;

    exp.value.values.forEach((variable: Statement) => {
      const cType = this.getCType(variable.value.dataType.value);
      const name = variable.value.name.value;
      const isConst = variable.value.isConst;
      code += "  ";

      if (isConst) code += "const ";
      code += `${cType} ${name};\n`;
    });

    code += `} ${interfaceName};\n`;

    this.insertBeforeMain(code);
  }

  transpile(exp: any = this.ast, addition: any = "") {
    switch (exp.type) {
      case "String":
        this.code += `"${exp.value}"${(addition) ? addition : ""}`;
        break;

      case "Number":
        this.code += `TSNumber(${exp.value})${(addition) ? addition : ""}`;
        break;

      case "Boolean":
        this.code += `${exp.value}${(addition) ? addition : ""}`;
        break;

      case "Scope":
        let createEnding = false;
        if (this.isTop) {
          this.createMain();
          this.isTop = false;
          createEnding = true;
        } else {
          this.code += "{\n";
        }

        exp.block.forEach((expr: any) => {
          this.transpile(expr);
        });

        if (createEnding) {
          this.code += `\n  return 0;`;
          // this.code += `\n  if (std::strcmp(argv[1], "--time") == 0) {\n    std::chrono::steady_clock::time_point CPPTIMEREND = std::chrono::steady_clock::now();\n    std::cout << std::endl << "Program finished in: " << std::chrono::duration_cast<std::chrono::nanoseconds> (CPPTIMEREND - CPPTIMERBEGIN).count() * 1e-9 << " seconds" << std::endl;\n  };\n  return 0;`;
          this.code += `\n}`;
        } else {
          this.code += `\n}\n`;
        }
        break;

      case "Assign":
        this.transpile(exp.left);
        this.code += " = ";
        this.transpile(exp.right, ";\n");
        break;

      case "Variable":
        this.createVar(exp);
        break;

      case "Identifier":
        this.code += `${exp.value}${(addition) ? addition : ""}`;
        break;

      case "Increment":
        if (addition)
          this.transpile(exp.value, "++" + addition);
        else
          this.transpile(exp.value, "++;\n");
        break;

      case "Decrement":
        this.transpile(exp.value);
        this.code += "--;\n";
        break;

      case "Function":
        this.createFunction(exp);
        break;

      case "FunctionCall":
        this.code += `${exp.value.name.value}(`;

        exp.value.args.forEach((arg: any) => {
          // console.log(arg);
          this.transpile(arg, false);
        });

        this.code += `)${(addition) ? addition : (typeof addition == "boolean") ? "" : ";\n"}`;
        break;

      case "Return":
        this.code += "return ";
        this.transpile(exp.value, ";\n");
        break;

      case "Binary":
        this.transpile(exp.left);
        this.code += ` ${exp.op} `;
        this.transpile(exp.right, addition);
        break;

      case "If":
        this.code += "if (";
        this.transpile(exp.value.condition, addition);
        this.code += ") ";
        this.transpile(exp.value.then, addition);

        if (exp.value.else) {
          this.code += "else ";
          this.transpile(exp.value.else);
        }
        break;

      case "AccessProp":
        this.code += ".";
        break;

      case "Interface":
        this.createStruct(exp);
        break;

      case "ForLoop":
        break;
    }

    return this.code;
  }
}