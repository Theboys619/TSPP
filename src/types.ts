export interface Token {
  type: string;
  value: any;
  index: number;
  line: number;
};

export interface LexerGrammar {
  Ignore: Array<string>,
  Whitespace: Array<string>,

  Keywords: Array<string>;
  Operators: Array<string>;
  BinOperators: Array<string>;
  Datatypes: Array<string>;
  DataToTok: { [x: string]: any };
  TokToData: { [x: string]: any };

  Digits: string,
  Strings: Array<string>,
  Delimiters: Array<string>,

  Special: Array<string>
};

export interface Precedence {
  "=": number,
  "+=": number, "-=": number,
  "*=": number, "/=": number, "%=": number,
  "||": number,
  "&&": number,
  "<": number, ">": number, "<=": number, ">=": number, "==": number, "===": number, "!=": number,
  "+": number, "-": number,
  "*": number, "/": number, "%": number,
  [x: string]: any
};