/**
 * The part of YAML that camera calibration files are written in.
 *
 * ROS `camera_info` files come out of yaml-cpp's emitter, PyYAML's `dump`, and people's editors, so
 * the reader accepts what those produce: block mappings, block and flow sequences, flow mappings,
 * plain and quoted scalars, comments, and a `%YAML` directive or `---` marker. It refuses what a
 * calibration never needs and a careless reader gets wrong -- anchors and aliases, tags, block
 * scalars, several documents in one file -- by name, rather than guessing.
 *
 * Hand-written for the same reason the profile validator is: a YAML library is larger than this whole
 * extension, and every extension that needs a camera loads this bundle.
 */

export type YamlValue = string | number | boolean | null | YamlValue[] | {[key: string]: YamlValue};

export class YamlError extends Error {
  public readonly line: number;

  public constructor(message: string, line: number) {
    super(line > 0 ? `Line ${line}: ${message}` : message);
    this.name = 'YamlError';
    this.line = line;
  }
}

interface Line {
  /** One-based, for messages. */
  readonly number: number;
  readonly indent: number;
  /** The content with the indentation and any trailing comment removed. */
  readonly text: string;
}

const MAXIMUM_DEPTH = 16;
const MAXIMUM_LENGTH = 64 * 1024;

export function parseYaml(source: string): YamlValue {
  if (source.length > MAXIMUM_LENGTH) {
    throw new YamlError('The document is longer than a calibration file ever is.', 0);
  }
  const lines = splitLines(source);
  if (lines.length === 0) throw new YamlError('The document is empty.', 0);
  const reader = new BlockReader(lines);
  const value = reader.readBlock(lines[0]!.indent, 0);
  if (!reader.done()) {
    const line = reader.peek()!;
    throw new YamlError('Unexpected indentation.', line.number);
  }
  return value;
}

function splitLines(source: string): Line[] {
  const lines: Line[] = [];
  let started = false;
  source
    .replace(/^﻿/, '')
    .split(/\r\n|\r|\n/)
    .forEach((raw, index) => {
      const number = index + 1;
      if (/\t/.test(raw.match(/^\s*/)![0])) {
        throw new YamlError('Tabs cannot indent YAML.', number);
      }
      const text = stripComment(raw).trimEnd();
      const content = text.trimStart();
      if (content.length === 0) return;
      if (!started && content.startsWith('%')) return;
      if (content === '---' || content.startsWith('--- ')) {
        if (started) throw new YamlError('Only one document is read from a calibration file.', number);
        started = true;
        const rest = content.slice(3).trim();
        if (rest.length > 0) lines.push({number, indent: 0, text: rest});
        return;
      }
      if (content === '...') {
        started = true;
        return;
      }
      started = true;
      lines.push({number, indent: text.length - content.length, text: content});
    });
  return lines;
}

/** Removes a `#` comment that is not inside quotes. A `#` only starts one after whitespace. */
function stripComment(raw: string): string {
  let quote: string | undefined;
  for (let index = 0; index < raw.length; index += 1) {
    const character = raw[index]!;
    if (quote) {
      if (character === '\\' && quote === '"') index += 1;
      else if (character === quote) quote = undefined;
      continue;
    }
    if (character === '"' || character === "'") quote = character;
    else if (character === '#' && (index === 0 || /\s/.test(raw[index - 1]!))) return raw.slice(0, index);
  }
  return raw;
}

class BlockReader {
  private index = 0;

  public constructor(private readonly lines: readonly Line[]) {}

  public done(): boolean {
    return this.index >= this.lines.length;
  }

  public peek(): Line | undefined {
    return this.lines[this.index];
  }

  public readBlock(indent: number, depth: number): YamlValue {
    if (depth > MAXIMUM_DEPTH) throw new YamlError('The document is nested too deeply.', this.peek()?.number ?? 0);
    const first = this.peek();
    if (!first) throw new YamlError('Expected a value.', 0);
    if (first.text === '-' || first.text.startsWith('- ')) return this.readSequence(indent, depth);
    if (findMappingColon(first.text) >= 0) return this.readMapping(indent, depth);
    this.index += 1;
    return this.readInline(first.text, first.number, first.indent);
  }

  private readMapping(indent: number, depth: number): {[key: string]: YamlValue} {
    const mapping: {[key: string]: YamlValue} = {};
    while (!this.done()) {
      const line = this.peek()!;
      if (line.indent < indent) break;
      if (line.indent > indent) throw new YamlError('Unexpected indentation.', line.number);
      const colon = findMappingColon(line.text);
      if (colon < 0) throw new YamlError('Expected a "key: value" pair.', line.number);
      const key = readKey(line.text.slice(0, colon).trim(), line.number);
      if (Object.prototype.hasOwnProperty.call(mapping, key)) {
        throw new YamlError(`The key "${key}" appears twice.`, line.number);
      }
      const rest = line.text.slice(colon + 1).trim();
      this.index += 1;
      if (rest.length > 0) {
        mapping[key] = this.readInline(rest, line.number, line.indent);
        continue;
      }
      const next = this.peek();
      const nestedSequence =
        next !== undefined && next.indent === indent && (next.text === '-' || next.text.startsWith('- '));
      if (next === undefined || (next.indent <= indent && !nestedSequence)) {
        mapping[key] = null;
      } else {
        mapping[key] = this.readBlock(next.indent, depth + 1);
      }
    }
    return mapping;
  }

  private readSequence(indent: number, depth: number): YamlValue[] {
    const sequence: YamlValue[] = [];
    while (!this.done()) {
      const line = this.peek()!;
      if (line.indent < indent || !(line.text === '-' || line.text.startsWith('- '))) break;
      if (line.indent > indent) throw new YamlError('Unexpected indentation.', line.number);
      const rest = line.text.slice(1).trim();
      this.index += 1;
      if (rest.length === 0) {
        const next = this.peek();
        sequence.push(next !== undefined && next.indent > indent ? this.readBlock(next.indent, depth + 1) : null);
      } else if (findMappingColon(rest) >= 0 && !/^[[{"']/.test(rest)) {
        throw new YamlError('A mapping inside a block sequence is not part of a calibration file.', line.number);
      } else {
        sequence.push(this.readInline(rest, line.number, line.indent));
      }
    }
    return sequence;
  }

  /**
   * Reads a value that starts on one line. A flow collection may continue on the lines after it, as
   * PyYAML writes long matrices, so those lines are drawn in until the brackets balance.
   */
  private readInline(text: string, number: number, indent: number): YamlValue {
    if (text.startsWith('[') || text.startsWith('{')) {
      let joined = text;
      while (!flowClosed(joined)) {
        const next = this.peek();
        if (!next || next.indent <= indent) throw new YamlError('A bracket is never closed.', number);
        joined += ` ${next.text}`;
        this.index += 1;
      }
      const flow = new FlowReader(joined, number);
      const value = flow.readValue(0);
      flow.expectEnd();
      return value;
    }
    return readScalar(text, number);
  }
}

/** Where the `: ` separating a key from its value is, or -1. Colons inside quotes do not count. */
function findMappingColon(text: string): number {
  let quote: string | undefined;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]!;
    if (quote) {
      if (character === '\\' && quote === '"') index += 1;
      else if (character === quote) quote = undefined;
      continue;
    }
    if (index === 0 && (character === '[' || character === '{')) return -1;
    if (character === '"' || character === "'") quote = character;
    else if (character === ':' && (index === text.length - 1 || text[index + 1] === ' ')) return index;
  }
  return -1;
}

function flowClosed(text: string): boolean {
  let depth = 0;
  let quote: string | undefined;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]!;
    if (quote) {
      if (character === '\\' && quote === '"') index += 1;
      else if (character === quote) quote = undefined;
      continue;
    }
    if (character === '"' || character === "'") quote = character;
    else if (character === '[' || character === '{') depth += 1;
    else if (character === ']' || character === '}') depth -= 1;
  }
  return depth <= 0;
}

function readKey(text: string, number: number): string {
  const value = readScalar(text, number);
  if (typeof value !== 'string') return String(value);
  return value;
}

class FlowReader {
  private index = 0;

  public constructor(
    private readonly text: string,
    private readonly number: number
  ) {}

  public readValue(depth: number): YamlValue {
    if (depth > MAXIMUM_DEPTH) throw new YamlError('The document is nested too deeply.', this.number);
    this.skipSpace();
    const character = this.text[this.index];
    if (character === '[') return this.readSequence(depth);
    if (character === '{') return this.readMapping(depth);
    return readScalar(this.readToken(), this.number);
  }

  public expectEnd(): void {
    this.skipSpace();
    if (this.index < this.text.length) {
      throw new YamlError('Unexpected text after a closing bracket.', this.number);
    }
  }

  private readSequence(depth: number): YamlValue[] {
    this.index += 1;
    const sequence: YamlValue[] = [];
    this.skipSpace();
    if (this.text[this.index] === ']') {
      this.index += 1;
      return sequence;
    }
    for (;;) {
      sequence.push(this.readValue(depth + 1));
      this.skipSpace();
      const separator = this.text[this.index];
      this.index += 1;
      if (separator === ']') return sequence;
      if (separator !== ',') throw new YamlError('Expected "," or "]" in a sequence.', this.number);
      this.skipSpace();
      // A trailing comma before the bracket is allowed.
      if (this.text[this.index] === ']') {
        this.index += 1;
        return sequence;
      }
    }
  }

  private readMapping(depth: number): {[key: string]: YamlValue} {
    this.index += 1;
    const mapping: {[key: string]: YamlValue} = {};
    this.skipSpace();
    if (this.text[this.index] === '}') {
      this.index += 1;
      return mapping;
    }
    for (;;) {
      this.skipSpace();
      const key = readKey(this.readToken(':'), this.number);
      this.skipSpace();
      if (this.text[this.index] !== ':') throw new YamlError('Expected ":" after a key.', this.number);
      this.index += 1;
      if (Object.prototype.hasOwnProperty.call(mapping, key)) {
        throw new YamlError(`The key "${key}" appears twice.`, this.number);
      }
      mapping[key] = this.readValue(depth + 1);
      this.skipSpace();
      const separator = this.text[this.index];
      this.index += 1;
      if (separator === '}') return mapping;
      if (separator !== ',') throw new YamlError('Expected "," or "}" in a mapping.', this.number);
      this.skipSpace();
      if (this.text[this.index] === '}') {
        this.index += 1;
        return mapping;
      }
    }
  }

  /** A quoted string, or plain text up to the next flow delimiter. */
  private readToken(stopAlso = ''): string {
    this.skipSpace();
    const start = this.index;
    const character = this.text[this.index];
    if (character === '"' || character === "'") {
      this.index += 1;
      while (this.index < this.text.length) {
        const current = this.text[this.index]!;
        if (current === '\\' && character === '"') {
          this.index += 2;
          continue;
        }
        if (current === character) {
          if (character === "'" && this.text[this.index + 1] === "'") {
            this.index += 2;
            continue;
          }
          this.index += 1;
          return this.text.slice(start, this.index);
        }
        this.index += 1;
      }
      throw new YamlError('A quoted string is never closed.', this.number);
    }
    while (this.index < this.text.length && !`,]}${stopAlso}`.includes(this.text[this.index]!)) {
      this.index += 1;
    }
    return this.text.slice(start, this.index).trim();
  }

  private skipSpace(): void {
    while (this.index < this.text.length && /\s/.test(this.text[this.index]!)) this.index += 1;
  }
}

const INTEGER = /^[-+]?(?:0|[1-9][0-9_]*)$/;
const FLOAT = /^[-+]?(?:[0-9][0-9_]*)?\.?[0-9]*(?:[eE][-+]?[0-9]+)?$/;

function readScalar(text: string, number: number): YamlValue {
  const value = text.trim();
  if (value.length === 0) return null;
  const first = value[0]!;
  if (first === '"') return readDoubleQuoted(value, number);
  if (first === "'") {
    if (value.length < 2 || !value.endsWith("'")) throw new YamlError('A quoted string is never closed.', number);
    return value.slice(1, -1).replace(/''/g, "'");
  }
  if (first === '&' || first === '*') throw new YamlError('Anchors and aliases are not read.', number);
  if (first === '!') throw new YamlError('Tags are not read.', number);
  if (first === '|' || first === '>') throw new YamlError('Block scalars are not read.', number);
  if (first === '@' || first === '`') throw new YamlError(`A plain value cannot start with "${first}".`, number);
  if (value === '~' || value === 'null' || value === 'Null' || value === 'NULL') return null;
  if (value === 'true' || value === 'True' || value === 'TRUE') return true;
  if (value === 'false' || value === 'False' || value === 'FALSE') return false;
  if (/^[-+]?\.(?:inf|Inf|INF|nan|NaN|NAN)$/.test(value)) {
    throw new YamlError('Infinity and NaN are not calibration values.', number);
  }
  if (INTEGER.test(value)) return Number(value.replace(/_/g, ''));
  if (/[0-9]/.test(value) && FLOAT.test(value)) {
    const parsed = Number(value.replace(/_/g, ''));
    if (Number.isFinite(parsed)) return parsed;
  }
  return value;
}

function readDoubleQuoted(value: string, number: number): string {
  if (value.length < 2 || !value.endsWith('"')) throw new YamlError('A quoted string is never closed.', number);
  const body = value.slice(1, -1);
  let result = '';
  for (let index = 0; index < body.length; index += 1) {
    const character = body[index]!;
    if (character !== '\\') {
      result += character;
      continue;
    }
    const escape = body[index + 1];
    index += 1;
    switch (escape) {
      case '"':
      case '\\':
      case '/':
        result += escape;
        break;
      case 'n':
        result += '\n';
        break;
      case 't':
        result += '\t';
        break;
      case 'r':
        result += '\r';
        break;
      case '0':
        result += '\0';
        break;
      case 'u': {
        const hex = body.slice(index + 1, index + 5);
        if (!/^[0-9a-fA-F]{4}$/.test(hex)) throw new YamlError('Invalid \\u escape.', number);
        result += String.fromCharCode(parseInt(hex, 16));
        index += 4;
        break;
      }
      default:
        throw new YamlError(`Unsupported escape "\\${escape ?? ''}".`, number);
    }
  }
  return result;
}
