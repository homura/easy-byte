import { add, asyncAdd } from '../';

test('test add', () => {
  expect(add(1, 1)).toBe(2);
});

test('test async add', async () => {
  const sum = await asyncAdd(1, 1);
  expect(sum).toBe(2);
});
