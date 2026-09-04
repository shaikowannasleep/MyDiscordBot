import test from 'node:test';
import assert from 'node:assert/strict';
import { DMBuzzerManager } from '../src/notification/DMBuzzerManager';

test('DMBuzzerManager - basic session lifecycle', async () => {
  DMBuzzerManager.stopAll();

  assert.equal(DMBuzzerManager.hasActiveBuzzer('user_test_1'), false);

  // Mock client with send spy
  let sentMessages: any[] = [];
  const mockUser = {
    id: 'user_test_1',
    send: async (payload: any) => {
      sentMessages.push(payload);
      return { id: 'msg_1' };
    }
  };

  const mockClient = {
    users: {
      fetch: async (id: string) => (id === 'user_test_1' ? mockUser : null)
    }
  } as any;

  // Start buzzing with fast interval for test
  const started = await DMBuzzerManager.startBuzzing(
    mockClient,
    'user_test_1',
    'Test Boss Alert',
    'Boss has spawned!',
    0x00ff00,
    undefined,
    { maxRepeats: 3, intervalMs: 50 }
  );

  assert.equal(started, true);
  assert.equal(DMBuzzerManager.hasActiveBuzzer('user_test_1'), true);
  assert.equal(sentMessages.length, 1);

  const session = DMBuzzerManager.getActiveSession('user_test_1');
  assert.ok(session);
  assert.equal(session.title, 'Test Boss Alert');

  // Stop buzzing
  const stopped = DMBuzzerManager.stopBuzzing('user_test_1');
  assert.equal(stopped, true);
  assert.equal(DMBuzzerManager.hasActiveBuzzer('user_test_1'), false);

  // Stopping again returns false
  assert.equal(DMBuzzerManager.stopBuzzing('user_test_1'), false);
});

test('DMBuzzerManager - automatically stops after maxRepeats', async () => {
  DMBuzzerManager.stopAll();

  let sentMessages: any[] = [];
  const mockUser = {
    id: 'user_test_2',
    send: async (payload: any) => {
      sentMessages.push(payload);
      return { id: 'msg_2' };
    }
  };

  const mockClient = {
    users: {
      fetch: async (id: string) => mockUser
    }
  } as any;

  await DMBuzzerManager.startBuzzing(
    mockClient,
    'user_test_2',
    'Short Boss Alert',
    'Quick check',
    0xff0000,
    undefined,
    { maxRepeats: 2, intervalMs: 30 }
  );

  assert.equal(DMBuzzerManager.hasActiveBuzzer('user_test_2'), true);

  // Wait for interval to run past maxRepeats (30ms * 3 = ~100ms)
  await new Promise((resolve) => setTimeout(resolve, 150));

  // Should have self-stopped
  assert.equal(DMBuzzerManager.hasActiveBuzzer('user_test_2'), false);
  // Initial + 2 repeats + 1 auto-stop final message = 4 messages
  assert.ok(sentMessages.length >= 3);

  DMBuzzerManager.stopAll();
});
