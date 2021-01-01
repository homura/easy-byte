import { createFixedStruct, U64LE, U8 } from '../';

test('encoding and decoding should be correct', () => {
  const messageStruct = createFixedStruct()
    .field('messageHeader', U8)
    // A value of u64 may exceed MAX_SAFE_INTEGER, so use a bigint to store this value
    .field('messageBody', U64LE);

  const struct = {
    messageHeader: 0x01,
    messageBody: 0xffffffffffffffffn, // a bigint
  };
  const bytes = Buffer.from('01ffffffffffffffff', 'hex');

  const encoded = messageStruct.encode(struct);
  expect(encoded).toEqual(bytes);

  const decoded = messageStruct.decode(bytes);
  expect(decoded).toEqual(struct);
});
