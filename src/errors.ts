export class TSCError {
  msg: string;
  errorType: string;

  constructor(msg: string, errorType?: string) {
    this.msg = msg;
    this.errorType = errorType ?? "TSCError";

    this.throw();
  }

  throw() {
    console.log(`${this.errorType}: ${this.msg}`);
    Deno.exit(1);
  }
}

export class TSCInvalidToken extends TSCError {
  constructor(msg: string) {
    super(msg, "TSCInvalidToken");
  }
}

export class TSCSyntaxError extends TSCError {
  constructor(msg: string) {
    super(msg, "TSCSyntaxError:");
  }
}