import { Database } from '../Database';

export interface BotUser {
  id?: number;
  discordUserId: string;
  timezone: string;
  createdAt: number;
  updatedAt: number;
}

export class UserRepository {
  public static getOrCreate(discordUserId: string, defaultTimezone = 'Asia/Ho_Chi_Minh'): BotUser {
    const db = Database.getInstance();
    const existing = db.prepare(`SELECT * FROM users WHERE discord_user_id = ?`).get(discordUserId) as any;

    if (existing) {
      return {
        id: existing.id,
        discordUserId: existing.discord_user_id,
        timezone: existing.timezone,
        createdAt: existing.created_at,
        updatedAt: existing.updated_at
      };
    }

    const now = Date.now();
    const stmt = db.prepare(`
      INSERT INTO users (discord_user_id, timezone, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(discordUserId, defaultTimezone, now, now);

    return {
      id: Number(result.lastInsertRowid),
      discordUserId,
      timezone: defaultTimezone,
      createdAt: now,
      updatedAt: now
    };
  }

  public static setTimezone(discordUserId: string, timezone: string): void {
    const db = Database.getInstance();
    const user = UserRepository.getOrCreate(discordUserId, timezone);
    db.prepare(`UPDATE users SET timezone = ?, updated_at = ? WHERE id = ?`).run(timezone, Date.now(), user.id!);
  }
}
