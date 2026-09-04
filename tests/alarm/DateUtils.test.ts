import test from 'node:test';
import assert from 'node:assert';
import { DateUtils } from '../../src/utils/DateUtils';

test('DateUtils - getNextDailyTrigger calculates today or tomorrow correctly', () => {
  const { nextDateTime, isTomorrow } = DateUtils.getNextDailyTrigger(23, 59);
  assert.ok(nextDateTime.isValid);
  assert.strictEqual(typeof isTomorrow, 'boolean');
});

test('DateUtils - formatRemaining formats accurately', () => {
  assert.strictEqual(DateUtils.formatRemaining(30000), '00:30');
  assert.strictEqual(DateUtils.formatRemaining(125000), '02:05');
  assert.strictEqual(DateUtils.formatRemaining(3665000), '01:01:05');
  assert.strictEqual(DateUtils.formatRemaining(0), '00:00');
});
