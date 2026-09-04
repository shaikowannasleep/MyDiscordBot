import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

export class Database {
  private static instance: DatabaseSync | null = null;

  public static getInstance(): DatabaseSync {
    if (!Database.instance) {
      const dbPath = process.env.DATABASE_PATH || './data/alarm_bot.sqlite';
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      Database.instance = new DatabaseSync(dbPath);
      Database.initSchema(Database.instance);
    }
    return Database.instance;
  }

  private static initSchema(db: DatabaseSync): void {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discord_user_id TEXT UNIQUE NOT NULL,
        timezone TEXT DEFAULT 'Asia/Ho_Chi_Minh',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS alarms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        guild_id TEXT,
        channel_id TEXT,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        trigger_at INTEGER NOT NULL,
        repeat_type TEXT,
        day_of_week INTEGER,
        notification_type TEXT DEFAULT 'channel',
        voice_session_id INTEGER,
        enabled INTEGER DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        guild_id TEXT,
        channel_id TEXT,
        name TEXT NOT NULL,
        time TEXT NOT NULL,
        repeat_type TEXT NOT NULL,
        day_of_week INTEGER,
        notification_type TEXT DEFAULT 'dm',
        custom_message TEXT,
        mention_tag TEXT,
        enabled INTEGER DEFAULT 1,
        next_trigger_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS event_subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL,
        user_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        UNIQUE(event_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS voice_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        ended_at INTEGER,
        active INTEGER DEFAULT 1
      );
    `);

    // Migration for existing databases
    try {
      db.exec(`ALTER TABLE events ADD COLUMN custom_message TEXT;`);
    } catch {}
    try {
      db.exec(`ALTER TABLE events ADD COLUMN mention_tag TEXT;`);
    } catch {}
  }
}
