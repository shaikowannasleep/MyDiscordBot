export interface ParsedDuration {
  totalSeconds: number;
  totalMilliseconds: number;
  formatted: string;
}

export class TimeParser {
  /**
   * Parses duration string like "20s", "15m", "1h", "2h30m", "1h15m20s"
   */
  public static parseDuration(input: string): ParsedDuration | null {
    if (!input || typeof input !== 'string') return null;

    const trimmed = input.trim().toLowerCase();
    const regex = /(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?\s*(?:(\d+)\s*s)?/;
    const match = trimmed.match(regex);

    if (!match || (!match[1] && !match[2] && !match[3])) {
      return null;
    }

    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);

    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    if (totalSeconds <= 0) return null;

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    if (seconds > 0) parts.push(`${seconds} second${seconds > 1 ? 's' : ''}`);

    return {
      totalSeconds,
      totalMilliseconds: totalSeconds * 1000,
      formatted: parts.join(' ')
    };
  }

  /**
   * Parses time string like "09:00", "19:04"
   */
  public static parseTimeOfDay(input: string): { hour: number; minute: number } | null {
    if (!input || typeof input !== 'string') return null;

    const trimmed = input.trim();
    const match = trimmed.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
    if (!match) return null;

    return {
      hour: parseInt(match[1], 10),
      minute: parseInt(match[2], 10)
    };
  }

  /**
   * Normalizes day of week string to 1-7 (1 = Monday, 7 = Sunday)
   */
  public static parseDayOfWeek(input: string): number | null {
    if (!input || typeof input !== 'string') return null;

    const normalized = input.trim().toLowerCase();
    const days: Record<string, number> = {
      monday: 1, mon: 1,
      tuesday: 2, tue: 2,
      wednesday: 3, wed: 3,
      thursday: 4, thu: 4,
      friday: 5, fri: 5,
      saturday: 6, sat: 6,
      sunday: 7, sun: 7
    };

    return days[normalized] || null;
  }

  public static getDayName(dayOfWeek: number): string {
    const names = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return names[dayOfWeek] || 'Unknown';
  }
}
