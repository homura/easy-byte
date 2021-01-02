# easy-byte

## Install

```
npm install easy-byte
```

## Quick Start

### Work With Struct

```ts
import { createFixedStruct, U8, U64LE } from 'easy-byte';

// prettier-ignore
// define the struct first
const messageStruct = createFixedStruct()
  .field('messageHeader', U8)
  .field('messageBody', U64LE);

const buf = messageStruct.encode({
  messageHeader: 0x01,
  // A value of u64 may exceed MAX_SAFE_INTEGER, so use a bigint to store this value
  // The built-in field parsing U64le also only supports reading and writing bigint
  messageBody: 0xffffffffffffffffn,
});

console.log(buf.tostring('hex')); // 01ffffffffffffffff

// also read a bytes and parse to an JS Object
console.log(messageStruct.decode(buf)); // { messageHeader: 0x01, messageBody: 0xffffffffffffffffn }
```

### Custom Work Pipe

```ts
import {
  pipe,
  littleEndianByteString,
  pad0x,
  padZeroToEvenLength,
  rm0x,
} from 'easy-byte';

const customFormat = pipe(
  rm0x,
  padZeroToEvenLength,
  littleEndianByteString,
  pad0x,
);
customFormat('0x001020304'); // 0x0403020100
```

### Or Work With `formatByteLike`

```ts
import { formatByteLike } from 'easy-byte';

const formated = formatByteLike('0x001020304', {
  le: true,
  rm0x: true,
  byteSize: 8,
});
console.log(formated); // 0403020100000000
```
