export interface BossTimer {
  id?: number;
  alarmId: number;
  bossName: string;
  spawnTime: number; // Unix timestamp
  remainingSeconds: number;
}
