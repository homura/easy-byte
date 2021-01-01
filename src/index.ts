import { Buffer } from 'buffer';

function createReader<T>(fnName: keyof Buffer): (buf: Buffer, offset?: number) => T {
  return function (buf: Buffer, offset = 0) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return buf[fnName](offset);
  };
}

function createWriter<T>(fnName: keyof Buffer): (buf: Buffer, val: T, offset?: number) => void {
  return function (buf: Buffer, val, offset = 0) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    buf[fnName](val, offset);
  };
}

type Read<T = number> = (buf: Buffer, offset?: number) => T;
type Write<T = number> = (buf: Buffer, val: T, offset?: number) => void;

interface Field<T = number> {
  byteWidth: number;
  read: Read<T>;
  write: Write<T>;
}

function createField<T>(byteWidth: number, read: Read<T>, write: Write<T>): Field<T> {
  return {
    byteWidth,
    read,
    write,
  };
}

type NamedField<T = any, K extends string = string> = [K, Field<T>];

interface Struct<S> {
  readonly fields: NamedField[];
  field: <Name extends string, T>(name: Name, type: Field<T>) => Struct<S & { [K in Name]: T }>;
  decode: (buf: Buffer) => S;
  encode: (obj: S) => Buffer;
}

class FixedStruct<T> implements Struct<T> {
  fields: NamedField[];

  constructor(fields: NamedField[] = []) {
    this.fields = fields;
  }

  field<Name extends string, F>(name: Name, field: Field<F>): Struct<T & Record<Name, F>> {
    const namedField: NamedField = [name, field];
    return new FixedStruct(this.fields.concat([namedField])) as Struct<T & Record<Name, F>>;
  }

  decode(buf: Buffer): T {
    const result = {} as T;

    let offset = 0;
    this.fields.forEach(([name, field]) => {
      const parsed = field.read(buf, offset);
      offset += field.byteWidth;
      result[name as keyof T] = parsed;
    });

    return result;
  }

  encode(obj: T): Buffer {
    const byteSize = this.fields.reduce((size, [, field]) => field.byteWidth + size, 0);
    const buf = Buffer.alloc(byteSize);

    let offset = 0;
    this.fields.forEach(([name, field]) => {
      field.write(buf, obj[name as keyof T], offset);
      offset += field.byteWidth;
    });

    return buf;
  }
}

export const I8 = createField(1, createReader<number>('readInt8'), createWriter<number>('writeInt8'));
export const U8 = createField(1, createReader<number>('readUInt8'), createWriter<number>('writeUInt8'));

export const I16LE = createField(2, createReader<number>('readInt16LE'), createWriter<number>('writeInt16LE'));
export const I16BE = createField(2, createReader<number>('readInt16BE'), createWriter<number>('writeInt16BE'));
export const U16LE = createField(2, createReader<number>('readUInt16LE'), createWriter<number>('writeUInt16LE'));
export const U16BE = createField(2, createReader<number>('readUInt16BE'), createWriter<number>('writeUInt16BE'));

export const I32LE = createField(4, createReader<number>('readInt32LE'), createWriter<number>('writeInt32LE'));
export const I32BE = createField(4, createReader<number>('readInt32BE'), createWriter<number>('writeInt32BE'));
export const U32LE = createField(4, createReader<number>('readUInt32LE'), createWriter<number>('writeUInt32LE'));
export const U32BE = createField(4, createReader<number>('readUInt32BE'), createWriter<number>('writeUInt32BE'));

export const I64LE = createField(8, createReader<bigint>('readBigInt64LE'), createWriter<bigint>('writeBigInt64LE'));
export const I64BE = createField(8, createReader<bigint>('readBigInt64BE'), createWriter<bigint>('writeBigInt64BE'));
export const U64LE = createField(8, createReader<bigint>('readBigUInt64LE'), createWriter<bigint>('writeBigUInt64LE'));
export const U64BE = createField(8, createReader<bigint>('readBigUInt64BE'), createWriter<bigint>('writeBigUInt64BE'));

// @formatter:off
// prettier-ignore
const U128_FIRST_HALF =  0xffffffff00000000n;
const U128_SECOND_HALF = 0x00000000ffffffffn;
// @formatter:on

function readBigUint128LE(buf: Buffer, offset = 0) {
  const left = buf.readBigUInt64LE(offset);
  const right = buf.readBigUInt64LE(offset + 8) << 31n;

  return left + right;
}

function writeBigUint128LE(buf: Buffer, val: bigint, offset = 0) {
  const left = U128_SECOND_HALF & val;
  const right = U128_FIRST_HALF & val;

  buf.writeBigUInt64LE(left, offset);
  buf.writeBigUInt64LE(right, offset + 4);
}

export const U128LE = createField(16, readBigUint128LE, writeBigUint128LE);

// eslint-disable-next-line @typescript-eslint/ban-types
export function createFixedStruct(): FixedStruct<{}> {
  return new FixedStruct();
}
