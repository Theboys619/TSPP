import { Lexer } from "./lexer.ts";
import { Token, LexerGrammar, Precedence } from "./types.ts";
import { TSCSyntaxError } from "./errors.ts";

const PREC: Precedence = {
  "=": 1,
  "+=": 2, "-=": 2,
  "*=": 3, "/=": 3, "%=": 3,
  "||": 4,
  "&&": 5,
  "<": 7, ">": 7, "<=": 7, ">=": 7, "==": 7, "===": 7, "!=": 7,
  "+": 10, "-": 10,
  "*": 20, "/": 20, "%": 20,
};

export class Scope {
  type: string;
  name: string;
  block: Array<any>;

  constructor(name?: string, block?: Array<any>) {
    this.type = "Scope";
    this.name = name ?? "Scope";

    this.block = block ?? [];
  }
};

export class Expression {
  type: string;
  left: any;
  op: string;
  right: any;

  constructor(type: string, left: any, op: string, right: any) {
    this.type = type;
    this.left = left;
    this.op = op;
    this.right = right;
  }
};

export class Statement {
  type: string;
  value: any;

  constructor(type: string, value?: any) {
    this.type = type;
    this.value = value ?? {};
  }
};

export class Parser {
  filepath: string;
  grammar: LexerGrammar;
  tokens: Array<Token>;

  curTok: Token;
  pos: number;

  ast: Scope;

  constructor(lexer: Lexer) {
    this.filepath = lexer.filepath;
    this.grammar = lexer.grammar;
    this.tokens = lexer.tokens;

    this.pos = 0;
    this.curTok = lexer.tokens[0];

    this.ast = new Scope("main");
  }

  advance(num: number = 1): Token {
    this.pos += num;
    this.curTok = this.tokens[this.pos];
    return this.curTok;
  }

  peek(num: number = 1): Token {
    return this.tokens[this.pos + num];
  }

  // Helping hand methods //

  constructNull() {
    return { type: "Null", value: null, index: this.peek(-1).index, line: this.peek(-1).line };
  }

  isKeyword(value?: string, peek?: Token): boolean {
    if (peek) {
      return peek.type == "Keyword" && (!value || peek.value == value);
    }

    return this.curTok.type == "Keyword" && (!value || this.curTok.value == value);
  }

  isDatatype(value?: string, peek?: Token): boolean {
    if (peek) {
      return peek.type == "Datatype" && (!value || peek.value == value);
    }

    return this.curTok.type == "Datatype" && (!value || this.curTok.value == value);
  }

  isIdentifier(value?: string, peek?: Token): boolean {
    if (peek) {
      return peek.type == "Identifier" && (!value || peek.value == value);
    }

    return this.curTok.type == "Identifier" && (!value || this.curTok.value == value);
  }

  isDelimiter(value?: string, peek?: Token): boolean {
    if (peek) {
      return peek.type == "Delimiter" && (!value || peek.value == value);
    }

    return this.curTok.type == "Delimiter" && (!value || this.curTok.value == value);
  }

  isOperator(value?: string, peek?: Token): boolean {
    if (peek) {
      return peek.type == "Operator" && (!value || peek.value == value);
    }

    return this.curTok.type == "Operator" && (!value || this.curTok.value == value);
  }

  isBinOperator(value?: string, peek?: Token): boolean {
    if (peek) {
      return peek.type == "BinOperator" && (!value || peek.value == value);
    }

    return this.curTok.type == "BinOperator" && (!value || this.curTok.value == value);
  }

  isNumber(value?: string, peek?: Token): boolean {
    if (peek) {
      return peek.type == "Number" && (!value || peek.value == value);
    }

    return this.curTok.type == "Number" && (!value || this.curTok.value == value);
  }

  isString(value?: string, peek?: Token): boolean {
    if (peek) {
      return peek.type == "String" && (!value || peek.value == value);
    }

    return this.curTok.type == "String" && (!value || this.curTok.value == value);
  }

  isLinebreak(value?: string, peek?: Token): boolean {
    if (peek) {
      return peek.type == "Linebreak" && (!value || peek.value == value);
    }

    return this.curTok.type == "Linebreak" && (!value || this.curTok.value == value);
  }

  isIgnore(peek?: Token): boolean {
    if (peek) {
      return this.grammar.Ignore.includes(peek.value);
    }

    return this.grammar.Ignore.includes(this.curTok.value);
  }

  isEOF() {
    return this.curTok.type == "EOF";
  }

  skipOver(value: Array<string> | string, type?: string) {
    let currentValue = "";
    let index = 0;
    const nextInput = () => {
      if (typeof value != "string") {
        currentValue = value[index];
        index++;
      } else {
        currentValue = value;
      }

      if (this.isKeyword(currentValue)) {
        this.advance();
      } else if (this.isIdentifier(currentValue)) {
        this.advance();
      } else if (this.isDatatype(currentValue)) {
        this.advance();
      } else if (this.isString(currentValue)) {
        this.advance();
      } else if (this.isNumber(currentValue)) {
        this.advance();
      } else if (this.isBinOperator(currentValue)) {
        this.advance();
      } else if (this.isOperator(currentValue)) {
        this.advance();
      } else if (this.isDelimiter(currentValue)) {
        this.advance();
      } else if (this.isLinebreak(currentValue)) {
        this.advance();
      } else {
        if (typeof value == "string" || index > value.length) {
          new TSCSyntaxError(`Invalid token '${this.curTok.value}' expected '${currentValue}'`)
        }
        nextInput();
      }
    }

    nextInput();
  }

  pDelimiters(start: Array<string> | string, end: string, separator: Array<string> | string, parser: Function) {
    const values = [];
    let isFirst = true;

    this.skipOver(start);
    while (!this.isEOF()) {

      if (this.isDelimiter(end)) break;

      if (isFirst)
        isFirst = false;
      else
        this.skipOver(separator);

      if (this.isDelimiter(end)) break;

      const parserBind = parser.bind(this, []);
      const value = parserBind();

      if (value)
        values.push(value);

    }
    this.skipOver(end);

    return values;
  }

  $isCall(exprCb: Function) {
    const expression = exprCb();

    return this.isDelimiter("(", this.peek()) ? this.pCall(expression) : expression;
  }

  pBinary(left: any, prec: number): any {
    const op = this.curTok;
    if (this.isBinOperator() || this.isOperator()) {
      const newPrec = PREC[op.value];
      if (newPrec > prec) {
        this.advance();
        const type = (op.value == "=") ? "Assign" : "Binary";
        return this.pBinary(new Expression(type, left, op.value, this.pBinary(this.pAll(), newPrec)), prec);
      }
    }


    return left;
  }

  pCall(funcname: Token) {
    this.advance();

    const funcStatement = new Statement("FunctionCall");
    const args = this.pDelimiters("(", ")", ",", this.pExpression);

    funcStatement.value = {
      name: funcname,
      args
    };

    return funcStatement;
  }

  pFunction() {
    this.skipOver("function");

    const funcStatement = new Statement("Function");
    const funcName = this.curTok;
    this.advance();
    
    const parameters = this.pDelimiters("(", ")", ",", this.pExpression);
    this.skipOver(":");

    const dataType = this.curTok;
    this.advance();

    const scope = new Scope(funcName.value, this.pDelimiters("{", "}", this.grammar.Ignore, this.pExpression));

    funcStatement.value = {
      name: funcName,
      dataType,
      parameters,
      scope
    }

    return funcStatement;
  }

  pReturn() {
    this.skipOver("return");

    let returnValue = this.curTok;

    if (this.isIgnore()) returnValue = this.constructNull();
    else {
      returnValue = this.pExpression();
    }

    return new Statement("Return", returnValue);
  }

  $isVariable(token: Token) {
    return this.isDelimiter(":", this.peek()) ? this.pVariable() : this.pIdentifier(token);
  }

  pVariable(isConst = false): Statement {
    const varName = this.curTok;// var x:

    this.advance();
    this.skipOver(":");

    if (!this.isDatatype() && !this.isIdentifier()) new TSCSyntaxError(`Expected a datatype or identifier but got '${this.curTok.value}'`);

    const dataType = this.curTok;
    this.advance();

    const varStatement = new Statement("Variable", {
      name: varName,
      dataType,
      isConst
    });

    return varStatement;
  }

  pIdentifier(token: Token) {
    if (this.isOperator("++")) {
      this.skipOver("++");
      return new Statement("Increment", token);
    }
    if (this.isOperator("--")) {
      this.skipOver("--");
      return new Statement("Decrement", token);
    }

    return token;
  }

  pIf() {
    this.skipOver("if");
    const ifStatement = new Statement("If");
    const condition = this.pExpression();

    ifStatement.value = {
      condition
    }

    ifStatement.value.then = new Scope(undefined, this.pDelimiters("{", "}", [";", "\n"], this.pExpression));

    if (this.isKeyword("else")) {
      this.skipOver("else");

      if (this.isKeyword("if")) {
        ifStatement.value.else = this.pIf();
      } else {
        ifStatement.value.else = new Scope(undefined, this.pDelimiters("{", "}", [";", "\n"], this.pExpression));
      }
    }

    return ifStatement;
  }

  pForLoop() {
    this.skipOver("for");
    this.skipOver("(");
    const variable = this.pExpression();
    this.skipOver(";");
    const condition = this.pExpression();
    this.skipOver(";");
    const operation = this.pExpression();
    this.skipOver(")");

    const scope = new Scope("ForLoop", this.pDelimiters("{", "}", this.grammar.Ignore, this.pExpression));
    const forStatement = new Statement("ForLoop", {
      condition,
      variable,
      operation,
      scope
    });

    return forStatement;
  }

  pInterface() {
    this.skipOver("interface");
    const interfaceName = this.curTok;
    this.advance();

    const interfaceStatement = new Statement("Interface", {
      name: interfaceName,
      values: this.pDelimiters("{", "}", [",", "\n"], this.pExpression)
    });

    return interfaceStatement;
  }

  pBoolean() {
    return new Statement("Boolean", {
      value: this.curTok.value == "true",
      index: this.curTok.index,
      line: this.curTok.line
    });
  }

  pAll() {
    return this.$isCall(() => {
      if (this.isDelimiter("(")) {
        this.skipOver("(");
        const expr = this.pExpression();
        this.skipOver(")");

        return expr;
      }

      if (this.isKeyword("let") || this.isKeyword("var")) {
        this.skipOver(["let", "var"]);
        return this.pVariable();
      }

      if (this.isKeyword("const")) {
        this.skipOver("const");
        return this.pVariable(true);
      }

      if (this.isKeyword("return")) {
        return this.pReturn();
      }

      if (this.isKeyword("true") || this.isKeyword("false")) {
        return this.pBoolean();
      }

      if (this.isKeyword("function")) {
        return this.pFunction();
      }

      if (this.isKeyword("if")) {
        return this.pIf();
      }

      if (this.isKeyword("for")) {
        return this.pForLoop();
      }

      if (this.isKeyword("interface")) {
        return this.pInterface();
      }

      if (this.isDelimiter(".")) {
        return new Statement("AccessProp");
      }

      const oldTok = this.curTok;

      if (this.isNumber()) {
        this.advance();
        return oldTok;
      } else if (this.isIdentifier()) {
        if (!this.isDelimiter("(", this.peek()) && !this.isDelimiter(":", this.peek()) && !this.isDelimiter(".", this.peek()))
          this.advance();

        return this.$isVariable(oldTok);
      }

      if (this.isString()) {
        this.advance();
        return oldTok;
      }
    });
  }

  pExpression(): any {
    return this.$isCall(() => {
      return this.pBinary(this.pAll(), 0);
    });
  }

  parse() {
    while (this.curTok != null && !this.isEOF()) {
      const expr = this.pExpression();
      if (expr) this.ast.block.push(expr);

      if (!this.isEOF()) this.skipOver(this.grammar.Ignore);
    }

    return this.ast;
  }
};