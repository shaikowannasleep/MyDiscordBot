import { Database } from '../Database';
import { GameEvent } from '../../domain/Event';

export class EventRepository {
  public static create(event: Omit<GameEvent, 'id' | 'createdAt' | 'updatedAt'>): GameEvent {
    const db = Database.getInstance();
    const now = Date.now();

    const stmt = db.prepare(`
      INSERT INTO events (
        user_id, guild_id, channel_id, name, time, repeat_type,
        day_of_week, notification_type, enabled, next_trigger_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      event.userId,
      event.guildId || null,
      event.channelId || null,
      event.name,
      event.time,
      event.repeatType,
      event.dayOfWeek || null,
      event.notificationType,
      event.enabled ? 1 : 0,
      event.nextTriggerAt,
      now,
      now
    );

    const id = Number(result.lastInsertRowid);
    return {
      ...event,
      id,
      createdAt: now,
      updatedAt: now
    };
  }

  public static findById(id: number): GameEvent | null {
    const db = Database.getInstance();
    const stmt = db.prepare(`SELECT * FROM events WHERE id = ?`);
    const row = stmt.get(id) as any;
    if (!row) return null;
    return EventRepository.mapRow(row);
  }

  public static findActiveByUserId(userId: string): GameEvent[] {
    const db = Database.getInstance();
    const stmt = db.prepare(`
      SELECT * FROM events 
      WHERE user_id = ? AND enabled = 1
      ORDER BY next_trigger_at ASC
    `);
    const rows = stmt.all(userId) as any[];
    return rows.map(EventRepository.mapRow);
  }

  public static findActiveAll(): GameEvent[] {
    const db = Database.getInstance();
    const stmt = db.prepare(`
      SELECT * FROM events 
      WHERE enabled = 1
      ORDER BY next_trigger_at ASC
    `);
    const rows = stmt.all() as any[];
    return rows.map(EventRepository.mapRow);
  }

  public static updateNextTrigger(id: number, nextTriggerAt: number): void {
    const db = Database.getInstance();
    const stmt = db.prepare(`UPDATE events SET next_trigger_at = ?, updated_at = ? WHERE id = ?`);
    stmt.run(nextTriggerAt, Date.now(), id);
  }

  public static disable(id: number): boolean {
    const db = Database.getInstance();
    const stmt = db.prepare(`UPDATE events SET enabled = 0, updated_at = ? WHERE id = ?`);
    const result = stmt.run(Date.now(), id);
    return result.changes > 0;
  }

  private static mapRow(row: any): GameEvent {
    return {
      id: row.id,
      userId: row.user_id,
      guildId: row.guild_id || undefined,
      channelId: row.channel_id || undefined,
      name: row.name,
      time: row.time,
      repeatType: row.repeat_type,
      dayOfWeek: row.day_of_week || undefined,
      notificationType: row.notification_type,
      enabled: row.enabled === 1,
      nextTriggerAt: row.next_trigger_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
