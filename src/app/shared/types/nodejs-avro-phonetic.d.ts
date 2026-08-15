/**
 * `nodejs-avro-phonetic` ships no type declarations (plain CJS package) — this covers just
 * the one function US-070's directive actually calls.
 */
declare module 'nodejs-avro-phonetic' {
  export function parse(text: string): string;
}
