import { DateTime, WeekdayNumbers } from 'luxon';

export class DateUtils {
  public static readonly DEFAULT_TIMEZONE = process.env.DEFAULT_TIMEZONE || 'Asia/Ho_Chi_Minh';

  /**
   * Returns current DateTime in specified timezone
   */
  public static now(timezone: string = DateUtils.DEFAULT_TIMEZONE): DateTime {
    return DateTime.now().setZone(timezone);
  }

  /**
   * Calculates the next timestamp for a specific hour:minute (e.g. 09:00).
   * If today's time hasn't passed, triggers today.
   * If today's time has already passed, triggers tomorrow.
   */
  public static getNextDailyTrigger(
    hour: number,
    minute: number,
    timezone: string = DateUtils.DEFAULT_TIMEZONE
  ): { nextDateTime: DateTime; isTomorrow: boolean } {
    const current = DateUtils.now(timezone);
    let target = current.set({ hour, minute, second: 0, millisecond: 0 });

    let isTomorrow = false;
    if (target <= current) {
      target = target.plus({ days: 1 });
      isTomorrow = true;
    }

    return { nextDateTime: target, isTomorrow };
  }

  /**
   * Calculates the next timestamp for a weekly event (dayOfWeek: 1=Mon .. 7=Sun).
   */
  public static getNextWeeklyTrigger(
    dayOfWeek: number,
    hour: number,
    minute: number,
    timezone: string = DateUtils.DEFAULT_TIMEZONE
  ): DateTime {
    const current = DateUtils.now(timezone);
    let target = current.set({ weekday: dayOfWeek as WeekdayNumbers, hour, minute, second: 0, millisecond: 0 });

    if (target <= current) {
      target = target.plus({ weeks: 1 });
    }

    return target;
  }

  /**
   * Formats DateTime into user-friendly string: "Today · 09:00" or "Tomorrow · 09:00" or "Saturday · 19:04"
   */
  public static formatFriendly(target: DateTime, timezone: string = DateUtils.DEFAULT_TIMEZONE): string {
    const now = DateUtils.now(timezone);
    const targetInZone = target.setZone(timezone);

    if (targetInZone.hasSame(now, 'day')) {
      return `Today · ${targetInZone.toFormat('HH:mm')}`;
    }
    if (targetInZone.hasSame(now.plus({ days: 1 }), 'day')) {
      return `Tomorrow · ${targetInZone.toFormat('HH:mm')}`;
    }

    return `${targetInZone.toFormat('cccc · HH:mm')}`;
  }

  /**
   * Formats remaining milliseconds into mm:ss or hh:mm:ss
   */
  public static formatRemaining(ms: number): string {
    if (ms <= 0) return '00:00';
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  }
}
