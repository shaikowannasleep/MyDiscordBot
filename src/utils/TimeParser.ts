export interface ParsedDuration {
  totalSeconds: number;
  totalMilliseconds: number;
  formatted: string;
  formattedVi?: string;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
}

const DAY_UNITS = new Set(['d', 'day', 'days', 'ngay', 'ng']);
const HOUR_UNITS = new Set(['h', 'hr', 'hrs', 'hour', 'hours', 'gio', 'tieng', 'g']);
const MINUTE_UNITS = new Set(['m', 'min', 'mins', 'minute', 'minutes', 'p', 'ph', 'phut']);
const SECOND_UNITS = new Set(['s', 'sec', 'secs', 'second', 'seconds', 'giay']);

export class TimeParser {
  /**
   * Parses duration string like:
   * - "20s", "15m", "1h", "2h30m"
   * - "9p30s" (9 phút 30 giây)
   * - "1d23h5p3s" (1 ngày 23 tiếng 5 phút 3 giây)
   * - "1 ngày 2 tiếng 30 phút 15 giây"
   */
  public static parseDuration(input: string): ParsedDuration | null {
    if (!input || typeof input !== 'string') return null;

    // Normalize Vietnamese diacritics and lowercase
    const normalized = input
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (!normalized) return null;

    const tokenRegex = /(\d+)\s*([a-zA-Z]+)/g;
    const matches = Array.from(normalized.matchAll(tokenRegex));

    if (matches.length === 0) return null;

    // Check if there are unparsed non-whitespace, non-separator characters
    const leftover = normalized.replace(tokenRegex, '').replace(/[\s,.-]+/g, '');
    if (leftover.length > 0) {
      return null;
    }

    let days = 0;
    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    for (const match of matches) {
      const val = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();

      if (DAY_UNITS.has(unit)) {
        days += val;
      } else if (HOUR_UNITS.has(unit)) {
        hours += val;
      } else if (MINUTE_UNITS.has(unit)) {
        minutes += val;
      } else if (SECOND_UNITS.has(unit)) {
        seconds += val;
      } else {
        return null; // Unknown unit
      }
    }

    const totalSeconds = days * 86400 + hours * 3600 + minutes * 60 + seconds;
    if (totalSeconds <= 0) return null;

    // English formatting
    const partsEn: string[] = [];
    if (days > 0) partsEn.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) partsEn.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0) partsEn.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    if (seconds > 0) partsEn.push(`${seconds} second${seconds > 1 ? 's' : ''}`);

    // Vietnamese formatting
    const partsVi: string[] = [];
    if (days > 0) partsVi.push(`${days} ngày`);
    if (hours > 0) partsVi.push(`${hours} tiếng`);
    if (minutes > 0) partsVi.push(`${minutes} phút`);
    if (seconds > 0) partsVi.push(`${seconds} giây`);

    return {
      totalSeconds,
      totalMilliseconds: totalSeconds * 1000,
      formatted: partsEn.join(' '),
      formattedVi: partsVi.join(' '),
      days,
      hours,
      minutes,
      seconds
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
   * Supports both English and Vietnamese (Thứ 2..Chủ Nhật, T2..CN)
   */
  public static parseDayOfWeek(input: string): number | null {
    if (!input || typeof input !== 'string') return null;

    const normalized = input
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // remove diacritics for flexible matching

    const days: Record<string, number> = {
      // Monday
      monday: 1, mon: 1, 'thu 2': 1, 'thu hai': 1, t2: 1,
      // Tuesday
      tuesday: 2, tue: 2, 'thu 3': 2, 'thu ba': 2, t3: 2,
      // Wednesday
      wednesday: 3, wed: 3, 'thu 4': 3, 'thu tu': 3, t4: 3,
      // Thursday
      thursday: 4, thu: 4, 'thu 5': 4, 'thu nam': 4, t5: 4,
      // Friday
      friday: 5, fri: 5, 'thu 6': 5, 'thu sau': 5, t6: 5,
      // Saturday
      saturday: 6, sat: 6, 'thu 7': 6, 'thu bay': 6, t7: 6,
      // Sunday
      sunday: 7, sun: 7, 'chu nhat': 7, cn: 7
    };

    return days[normalized] || null;
  }

  public static getDayName(dayOfWeek: number): string {
    const names = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return names[dayOfWeek] || 'Unknown';
  }

  public static getDayNameVi(dayOfWeek: number): string {
    const names = ['', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
    return names[dayOfWeek] || 'Không rõ';
  }
}
