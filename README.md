# easy-byte

## Install

```
npm install easy-byte
```

## Quick Start

```ts
import { createFixedStruct, U8, U64LE } from 'easy-byte';

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
