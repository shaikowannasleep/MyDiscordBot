import { Database } from '../Database';
import { VoiceSession } from '../../domain/VoiceSession';

export class VoiceSessionRepository {
  public static create(session: Omit<VoiceSession, 'id'>): VoiceSession {
    const db = Database.getInstance();

    const stmt = db.prepare(`
      INSERT INTO voice_sessions (
        user_id, guild_id, channel_id, started_at, active
      ) VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      session.userId,
      session.guildId,
      session.channelId,
      session.startedAt,
      session.active ? 1 : 0
    );

    const id = Number(result.lastInsertRowid);
    return {
      ...session,
      id
    };
  }

  public static findActiveByGuildId(guildId: string): VoiceSession | null {
    const db = Database.getInstance();
    const stmt = db.prepare(`
      SELECT * FROM voice_sessions 
      WHERE guild_id = ? AND active = 1
      ORDER BY started_at DESC LIMIT 1
    `);
    const row = stmt.get(guildId) as any;
    if (!row) return null;
    return VoiceSessionRepository.mapRow(row);
  }

  public static endSession(id: number): void {
    const db = Database.getInstance();
    const stmt = db.prepare(`
      UPDATE voice_sessions 
      SET active = 0, ended_at = ? 
      WHERE id = ?
    `);
    stmt.run(Date.now(), id);
  }

  public static endAllForGuild(guildId: string): void {
    const db = Database.getInstance();
    const stmt = db.prepare(`
      UPDATE voice_sessions 
      SET active = 0, ended_at = ? 
      WHERE guild_id = ? AND active = 1
    `);
    stmt.run(Date.now(), guildId);
  }

  private static mapRow(row: any): VoiceSession {
    return {
      id: row.id,
      userId: row.user_id,
      guildId: row.guild_id,
      channelId: row.channel_id,
      startedAt: row.started_at,
      endedAt: row.ended_at || undefined,
      active: row.active === 1
    };
  }
}
