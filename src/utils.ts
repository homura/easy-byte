import { Buffer } from 'buffer';

type Fn<I, O> = (input: I) => O;

interface Pipe {
  <I, O>(fn: Fn<I, O>): Fn<I, O>;

  <I1, O1, I2, O2>(fn1: Fn<I1, O1>, fn2: Fn<I2, O2>): Fn<I1, O2>;

  <I1, O1, I2, O2, I3, O3>(fn1: Fn<I1, O1>, fn2: Fn<I2, O2>, fn3: Fn<I3, O3>): Fn<I1, O3>;

  <I, O>(...fn: Fn<I, O>[]): Fn<I, O>;
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const pipe: Pipe = (...fn) => {
  if (fn.length === 1) return fn[0];
  return fn.reduce((fn1, fn2) => (x: unknown) => fn2(fn1(x)));
};

export type ByteLike = Uint8Array | Buffer | string;

export function startsWith0x(x: unknown): boolean {
  return typeof x === 'string' && x.startsWith('0x');
}

export function rm0x(input: string): string {
  if (startsWith0x(input)) return input.slice(2);
  return input;
}

export function pad0x(input: string): string {
  if (startsWith0x(input)) return input;
  return '0x' + input;
}

export function padZeroToEvenLength(input: string): string {
  if (input.length % 2 === 0) return input;
  return `0${input}`;
}

export function littleEndianByteString(input: string): string {
  if (!input || input.length < 2) return input;
  const grouped = padZeroToEvenLength(input).match(/../g);
  if (!grouped) return '';
  return grouped.reverse().join('');
}

export interface FormatOptions {
  /**
   * pad 0x in output
   */
  pad0x?: boolean;
  /**
   * remove the beginning `0x` if the input starts with 0x
   */
  rm0x?: boolean;
  /**
   * expected byte size
   */
  byteSize?: number;

  /**
   * little endian
   */
  le?: boolean;
}

/**
 * A byte is generally composed of two hex characters, and this function ensures that
 * the length of the output byte string used to represent the byte is an even number
 */
export function formatByteLike(input: ByteLike, options: FormatOptions = {}): string {
  // a byte string composed by many hex characters without 0x
  let byteString;

  if (typeof input === 'string') byteString = rm0x(input);
  else byteString = Buffer.from(input).toString('hex');

  byteString = padZeroToEvenLength(byteString);

  const expectedByteSize = options.byteSize === undefined ? byteString.length / 2 : options.byteSize;
  const shouldPad0x = !options.rm0x && (options.pad0x || startsWith0x(input));

  if (expectedByteSize <= 0 && shouldPad0x) return '0x';
  if (expectedByteSize <= 0) return '';

  if (expectedByteSize !== byteString.length * 2) {
    byteString = byteString.slice(-expectedByteSize * 2).padStart(expectedByteSize * 2, '0');
  }
  if (options.le) {
    byteString = littleEndianByteString(byteString);
  }
  if (shouldPad0x) {
    byteString = pad0x(byteString);
  }

  return byteString;
}

export function toUnfixedBuffer(input: ByteLike): Buffer {
  if (Buffer.isBuffer(input) || input instanceof Uint8Array) return Buffer.from(input);

  return Buffer.from(formatByteLike(input, { rm0x: true }), 'hex');
}

export function toFixedBuffer(buffer: ByteLike, byteSize: number): Buffer {
  if (byteSize === 0) return Buffer.from([]);

  const unfixed = toUnfixedBuffer(buffer);
  const unfixedSize = unfixed.length;

  if (unfixedSize === 0) return Buffer.alloc(byteSize);
  if (unfixedSize === byteSize) return unfixed;

  if (unfixedSize > byteSize) return unfixed.slice(unfixedSize - byteSize);

  return Buffer.concat([Buffer.alloc(byteSize - unfixedSize), unfixed]);
}

export function toBuffer(input: ByteLike, byteSize?: number): Buffer {
  if (byteSize === undefined) return toUnfixedBuffer(input);
  return toFixedBuffer(input, byteSize);
}
