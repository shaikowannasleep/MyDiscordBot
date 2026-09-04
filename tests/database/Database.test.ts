import test from 'node:test';
import assert from 'node:assert';
import { Database } from '../../src/database/Database';
import { AlarmRepository } from '../../src/database/repositories/AlarmRepository';
import { EventRepository } from '../../src/database/repositories/EventRepository';

// Point test database to memory
process.env.DATABASE_PATH = ':memory:';

test('Database & AlarmRepository - create, query, disable', () => {
  const db = Database.getInstance();
  assert.ok(db);

  const alarm = AlarmRepository.create({
    userId: 'user-test-123',
    guildId: 'guild-test',
    channelId: 'channel-test',
    type: 'quick',
    title: 'Test Quick Alarm',
    triggerAt: Date.now() + 60000,
    notificationType: 'channel',
    enabled: true
  });

  assert.ok(alarm.id);
  assert.strictEqual(alarm.title, 'Test Quick Alarm');

  const found = AlarmRepository.findById(alarm.id!);
  assert.ok(found);
  assert.strictEqual(found?.enabled, true);

  const active = AlarmRepository.findActiveByUserId('user-test-123');
  assert.strictEqual(active.length, 1);

  AlarmRepository.disable(alarm.id!);
  const afterDisable = AlarmRepository.findActiveByUserId('user-test-123');
  assert.strictEqual(afterDisable.length, 0);
});

test('EventRepository - create, query, update', () => {
  const event = EventRepository.create({
    userId: 'user-test-123',
    name: 'Thành Chiến',
    time: '19:04',
    repeatType: 'weekly',
    dayOfWeek: 6,
    notificationType: 'dm',
    enabled: true,
    nextTriggerAt: Date.now() + 3600000
  });

  assert.ok(event.id);
  const activeEvents = EventRepository.findActiveByUserId('user-test-123');
  assert.strictEqual(activeEvents.length, 1);
  assert.strictEqual(activeEvents[0].name, 'Thành Chiến');
});
