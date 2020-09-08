import { Token, LexerGrammar } from "./types.ts";
import { TSCInvalidToken } from "./errors.ts";
export const grammar: LexerGrammar = {
  Ignore: [";", "\n"],
  Whitespace: [" ", "\t", "\r"],

  Keywords: ["const", "let", "var", "if", "else", "return", "typeof", "try", "catch", "finally", "function", "of", "in", "for", "while", "interface", "true", "false", "null"],
  Datatypes: ["number", "string", "boolean", "object", "any", "void"],
  DataToTok: {
    "number": "Number",
    "string": "String",
    "boolean": "Boolean",
    "object": "Object",
    "any": ["Number", "String", "Boolean", "Object"]
  },
  TokToData: {
    "Number": "number",
    "String": "string",
    "Boolean": "boolean",
    "Object": "object"
  },

  Operators: ["=", "==", "===", "!=", "!==", "<", "<=", ">", ">=", "&&", "||", "+=", "-=", "*=", "/=", "%=", "++", "--"],
  BinOperators: ["+", "-", "*", "/", "%"],

  Digits: "0123456789",
  Strings: ["\"", "\`", "\'"],
  Delimiters: [";", ":", ".", ",", "{", "}", "(", ")"],

  Special: ["_", "$", "@", "#"]
};

export class Lexer {
  input: string;
  filepath: string;
  grammar: LexerGrammar;
  
  tokens: Array<Token>;

  char: string;
  pos: number;
  index: number;
  line: number;

  constructor(input: string, filepath: string, grammar: LexerGrammar) {
    this.input = input;
    this.filepath = filepath;
    this.grammar = grammar;

    this.tokens = [];

    this.char = input[0];
    this.pos = 0;
    this.index = 0;
    this.line = 0;
  }

  advance(num: number = 1) {
    this.pos += num;
    this.index += num;
    this.char = this.input[this.pos];
    return this.char;
  }

  peek(num: number = 1) {
    return this.input[this.pos + num];
  }

  isWhitespace(char = this.char): boolean {
    return this.grammar.Whitespace.includes(char);
  }

  isLinebreak(char = this.char): boolean {
    return char == "\n";
  }

  isLetter(char = this.char) {
    return (char >= "a" && "z" >= char) || (char >= "A" && "Z" >= char);
  }

  isNumber(char = this.char) {
    if (char == "-" && this.grammar.Digits.includes(this.peek())) return true;
    return this.grammar.Digits.includes(char);
  }

  isString(char = this.char) {
    return this.grammar.Strings.includes(char);
  }

  isOperator(char = this.char) {
    return (
      this.grammar.Operators.includes(char) ||
      this.grammar.Operators.includes(char + this.peek()) ||
      this.grammar.Operators.includes(char + this.peek() + this.peek())
    );
  }

  isBinOperator(char = this.char) {
    return this.grammar.BinOperators.includes(char);
  }

  isDelimiter(char = this.char) {
    return this.grammar.Delimiters.includes(char);
  }

  isSpecial(char = this.char) {
    return this.grammar.Special.includes(char);
  }

  isIdentifier(char = this.char) {
    return this.isLetter(char) || this.isNumber(char) || this.isSpecial(char);
  }

  tokenize(): Array<Token> {
    while (this.char != null) {
      const lastPos = this.pos;
      if (this.isWhitespace()) {
        this.advance();
      }

      if (this.isLinebreak()) {
        this.tokens.push({
          type: "Linebreak",
          value: "\n",
          index: this.index,
          line: this.line
        });

        this.advance();

        this.line++;
        this.index = 0;
      }

      if (this.isOperator()) {
        let op = this.char;
        let index = this.index;
        let line = this.line;

        while (this.isOperator(op + this.peek()) && this.char != null) {
          this.advance();
          op += this.char;
        }

        this.tokens.push({
          type: "Operator",
          value: op,
          index,
          line
        });

        this.advance();
      } else if (this.isBinOperator()) {
        this.tokens.push({
          type: "BinOperator",
          value: this.char,
          index: this.index,
          line: this.line
        });

        this.advance();
      }

      if (this.isNumber()) {
        let str = this.char;
        let index = this.index;
        let line = this.line;

        this.advance();

        while (this.char != null && this.isNumber()) {
          str += this.char;
          this.advance();
        }

        if (this.char == ".") {
          str += this.char;
          this.advance();
          while (this.char != null && this.isNumber()) {
            str += this.char;
            this.advance();
          }
        }

        this.tokens.push({
          type: "Number",
          value: parseFloat(str),
          index,
          line
        });
      }

      if (this.isString()) {
        let value = "";
        let index = this.index;
        let line = this.line;

        this.advance();

        while (this.char != null && !this.isString()) {
          value += this.char;
          this.advance();
        }

        this.tokens.push({
          type: "String",
          value,
          index,
          line
        });

        this.advance();
      }

      if (this.isDelimiter()) {
        this.tokens.push({
          type: "Delimiter",
          value: this.char,
          index: this.index,
          line: this.line
        });

        this.advance();
      }
      
      if (this.isLetter()) {
        let value = "";
        let type = "Identifier";
        let index = this.index;
        let line = this.line;

        while (this.char != null && (this.isIdentifier())) {
          value += this.char;
          this.advance();
        }

        if (this.grammar.Datatypes.includes(value)) type = "Datatype";
        if (this.grammar.Keywords.includes(value)) type = "Keyword";

        this.tokens.push({
          type,
          value,
          index,
          line
        });
      }

      if (lastPos == this.pos) {
        new TSCInvalidToken(`Unknown character '${this.char}'`);
      }
    }

    this.tokens.push({
      type: "EOF",
      value: "EOF",
      index: 0,
      line: this.line + 1
    });

    return this.tokens;
  }
}