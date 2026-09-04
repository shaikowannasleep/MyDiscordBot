import { Database } from '../Database';
import { Alarm } from '../../domain/Alarm';

export class AlarmRepository {
  public static create(alarm: Omit<Alarm, 'id' | 'createdAt' | 'updatedAt'>): Alarm {
    const db = Database.getInstance();
    const now = Date.now();

    const stmt = db.prepare(`
      INSERT INTO alarms (
        user_id, guild_id, channel_id, type, title, trigger_at,
        notification_type, voice_session_id, enabled, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      alarm.userId,
      alarm.guildId || null,
      alarm.channelId || null,
      alarm.type,
      alarm.title,
      alarm.triggerAt,
      alarm.notificationType,
      alarm.voiceSessionId || null,
      alarm.enabled ? 1 : 0,
      now,
      now
    );

    const id = Number(result.lastInsertRowid);
    return {
      ...alarm,
      id,
      createdAt: now,
      updatedAt: now
    };
  }

  public static findById(id: number): Alarm | null {
    const db = Database.getInstance();
    const stmt = db.prepare(`SELECT * FROM alarms WHERE id = ?`);
    const row = stmt.get(id) as any;
    if (!row) return null;
    return AlarmRepository.mapRow(row);
  }

  public static findActiveByUserId(userId: string): Alarm[] {
    const db = Database.getInstance();
    const stmt = db.prepare(`
      SELECT * FROM alarms 
      WHERE user_id = ? AND enabled = 1
      ORDER BY trigger_at ASC
    `);
    const rows = stmt.all(userId) as any[];
    return rows.map(AlarmRepository.mapRow);
  }

  public static findActiveAll(): Alarm[] {
    const db = Database.getInstance();
    const stmt = db.prepare(`
      SELECT * FROM alarms 
      WHERE enabled = 1
      ORDER BY trigger_at ASC
    `);
    const rows = stmt.all() as any[];
    return rows.map(AlarmRepository.mapRow);
  }

  public static findByVoiceSessionId(voiceSessionId: number): Alarm[] {
    const db = Database.getInstance();
    const stmt = db.prepare(`
      SELECT * FROM alarms 
      WHERE voice_session_id = ? AND enabled = 1
    `);
    const rows = stmt.all(voiceSessionId) as any[];
    return rows.map(AlarmRepository.mapRow);
  }

  public static disable(id: number): boolean {
    const db = Database.getInstance();
    const stmt = db.prepare(`UPDATE alarms SET enabled = 0, updated_at = ? WHERE id = ?`);
    const result = stmt.run(Date.now(), id);
    return result.changes > 0;
  }

  public static disableAllTemporaryByUserId(userId: string): number {
    const db = Database.getInstance();
    const stmt = db.prepare(`
      UPDATE alarms 
      SET enabled = 0, updated_at = ? 
      WHERE user_id = ? AND enabled = 1
    `);
    const result = stmt.run(Date.now(), userId);
    return Number(result.changes);
  }

  public static disableByVoiceSessionId(voiceSessionId: number): number {
    const db = Database.getInstance();
    const stmt = db.prepare(`
      UPDATE alarms 
      SET enabled = 0, updated_at = ? 
      WHERE voice_session_id = ? AND enabled = 1
    `);
    const result = stmt.run(Date.now(), voiceSessionId);
    return Number(result.changes);
  }

  private static mapRow(row: any): Alarm {
    return {
      id: row.id,
      userId: row.user_id,
      guildId: row.guild_id || undefined,
      channelId: row.channel_id || undefined,
      type: row.type,
      title: row.title,
      triggerAt: row.trigger_at,
      notificationType: row.notification_type,
      voiceSessionId: row.voice_session_id || undefined,
      enabled: row.enabled === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
