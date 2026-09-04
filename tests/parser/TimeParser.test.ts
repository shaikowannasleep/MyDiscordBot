import test from 'node:test';
import assert from 'node:assert';
import { TimeParser } from '../../src/utils/TimeParser';

test('TimeParser - parses quick duration strings correctly', () => {
  const t20s = TimeParser.parseDuration('20s');
  assert.strictEqual(t20s?.totalSeconds, 20);
  assert.strictEqual(t20s?.totalMilliseconds, 20000);
  assert.strictEqual(t20s?.formatted, '20 seconds');

  const t20m = TimeParser.parseDuration('20m');
  assert.strictEqual(t20m?.totalSeconds, 1200);
  assert.strictEqual(t20m?.formatted, '20 minutes');

  const t1h = TimeParser.parseDuration('1h');
  assert.strictEqual(t1h?.totalSeconds, 3600);
  assert.strictEqual(t1h?.formatted, '1 hour');

  const t2h30m = TimeParser.parseDuration('2h30m');
  assert.strictEqual(t2h30m?.totalSeconds, 9000);
  assert.strictEqual(t2h30m?.formatted, '2 hours 30 minutes');

  // Test 9p30s (9 minutes 30 seconds)
  const t9p30s = TimeParser.parseDuration('9p30s');
  assert.strictEqual(t9p30s?.totalSeconds, 570);
  assert.strictEqual(t9p30s?.formatted, '9 minutes 30 seconds');
  assert.strictEqual(t9p30s?.formattedVi, '9 phút 30 giây');

  // Test 1d23h5p3s (1 day 23 hours 5 minutes 3 seconds)
  const tComplex = TimeParser.parseDuration('1d23h5p3s');
  assert.strictEqual(tComplex?.totalSeconds, 86400 + 23 * 3600 + 5 * 60 + 3);
  assert.strictEqual(tComplex?.formatted, '1 day 23 hours 5 minutes 3 seconds');
  assert.strictEqual(tComplex?.formattedVi, '1 ngày 23 tiếng 5 phút 3 giây');

  // Test Vietnamese phrases
  const tVi = TimeParser.parseDuration('1 ngày 2 tiếng 30 phút');
  assert.strictEqual(tVi?.totalSeconds, 86400 + 7200 + 1800);
  assert.strictEqual(tVi?.formattedVi, '1 ngày 2 tiếng 30 phút');

  assert.strictEqual(TimeParser.parseDuration('invalid'), null);
  assert.strictEqual(TimeParser.parseDuration(''), null);
});

test('TimeParser - parses HH:mm format correctly', () => {
  const t1 = TimeParser.parseTimeOfDay('09:00');
  assert.deepStrictEqual(t1, { hour: 9, minute: 0 });

  const t2 = TimeParser.parseTimeOfDay('19:04');
  assert.deepStrictEqual(t2, { hour: 19, minute: 4 });

  assert.strictEqual(TimeParser.parseTimeOfDay('25:00'), null);
  assert.strictEqual(TimeParser.parseTimeOfDay('12:60'), null);
  assert.strictEqual(TimeParser.parseTimeOfDay('abc'), null);
});

test('TimeParser - parses day of week strings', () => {
  assert.strictEqual(TimeParser.parseDayOfWeek('saturday'), 6);
  assert.strictEqual(TimeParser.parseDayOfWeek('sat'), 6);
  assert.strictEqual(TimeParser.parseDayOfWeek('Monday'), 1);
  assert.strictEqual(TimeParser.parseDayOfWeek('friday'), 5);
  assert.strictEqual(TimeParser.parseDayOfWeek('invalid'), null);
});
