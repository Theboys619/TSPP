import { Lexer, grammar } from "./src/lexer.ts";
import * as Path from "https://deno.land/std@0.65.0/path/mod.ts";
import { Parser } from "./src/parser.ts";
import { Transpiler } from "./src/transpiler.ts";

const __dirname = Path.dirname(new URL(import.meta.url).pathname).substring(1);
const decoder = new TextDecoder("utf8");
const encoder = new TextEncoder();
let argc = Deno.args.length;
let argv = [...Deno.args];

async function runFile(filePath: string) {
  const fileName = filePath.split(/\/|\\/g)[filePath.split(/\/|\\/g).length - 1].replace(".ts", "");
  const input = decoder.decode(await Deno.readFile(filePath));
  const lexer = new Lexer(input, filePath, grammar);

  let wsPath: any = filePath.split(/\/|\\/g);
  wsPath.splice(wsPath.length-1, 1);
  wsPath = wsPath.join("/")

  // console.log(lexer.tokenize());
  lexer.tokenize();

  const parser = new Parser(lexer);
  parser.parse()
  // console.log(parser.parse().block);

  const transpiler = new Transpiler(parser);
  const outFile = Path.join(wsPath, `${fileName}.cpp`);
  const outBinary = Path.join(wsPath, fileName) + (Deno.build.os == "windows") ? ".exe" : "";
  for await (const dirEntry of Deno.readDir(Path.join(__dirname, "/src/stdlibs"))) {
    const path = Path.join(__dirname, "/src/stdlibs", dirEntry.name);
    await transpiler.defineLib(path);
  }

  transpiler.transpile();
  
  await Deno.writeFile(outFile, encoder.encode(transpiler.code));

  // console.log("FILENAME:", fileName, "FILEPATH:", filePath, "WSPATH:", wsPath, "OUTFILE:", outFile);

  const process = Deno.run({
    stdout: "piped",
    cmd: ["clang++", "-pthread", "-std=c++17", "-o", outBinary, outFile]
  });

  console.log("Compiling...\n" + decoder.decode(await process.output()));

  const runner = Deno.run({
    stdout: "piped",
    stderr: "piped",
    cmd: [Path.join(wsPath, fileName) + ".exe"]
  });

  console.log("Running...\n" + decoder.decode(await runner.output()));
}

async function main() {
  if (argv[0] == "run") {
    const filePath = Path.join(Path.resolve(argv[1]));
    runFile(filePath);
  }
}

main();