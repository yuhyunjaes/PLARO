// 날짜 정규화 유틸리티 함수들
let userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

const toTimezoneWallDate = (date: Date, timezone: string): Date => {
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const get = (type: Intl.DateTimeFormatPartTypes): number =>
        Number(parts.find((p) => p.type === type)?.value ?? "0");

    return new Date(
        get("year"),
        get("month") - 1,
        get("day"),
        get("hour"),
        get("minute"),
        get("second"),
        0
    );
};

export const DateUtils = {
    setUserTimezone: (timezone?: string | null): void => {
        if (!timezone) return;
        userTimezone = timezone;
    },

    getUserTimezone: (): string => userTimezone,

    now: (): Date => {
        return toTimezoneWallDate(new Date(), userTimezone);
    },

    parseServerDate: (value: string | Date | null | undefined): Date => {
        if (value instanceof Date) {
            return new Date(value.getTime());
        }

        if (!value || typeof value !== "string") {
            return new Date(NaN);
        }

        const normalized = value.trim().replace("T", " ").replace(/\.\d+$/, "");
        const plainMatch = normalized.match(
            /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/
        );

        // timezone 정보가 없는 값은 wall-time 그대로 사용
        if (plainMatch && !value.includes("Z") && !/[+-]\d{2}:\d{2}$/.test(value)) {
            const year = Number(plainMatch[1]);
            const month = Number(plainMatch[2]) - 1;
            const day = Number(plainMatch[3]);
            const hour = Number(plainMatch[4]);
            const minute = Number(plainMatch[5]);
            const second = Number(plainMatch[6] ?? "0");

            return new Date(year, month, day, hour, minute, second, 0);
        }

        const parsed = new Date(value);
        if (isNaN(parsed.getTime())) return parsed;

        return toTimezoneWallDate(parsed, userTimezone);
    },

    toApiDateTime: (date: Date | null): string | null => {
        if (!date || isNaN(date.getTime())) return null;

        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        const hh = String(date.getHours()).padStart(2, "0");
        const mi = String(date.getMinutes()).padStart(2, "0");
        const ss = String(date.getSeconds()).padStart(2, "0");

        return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
    },

    // 날짜를 하루의 시작(00:00:00.000)으로 정규화
    toStartOfDay: (date: Date | null): Date | null => {
        if (!date) return null;
        return new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            0, 0, 0, 0
        );
    },

    // 날짜를 하루의 끝(23:59:59.999)으로 정규화
    toEndOfDay: (date: Date | null): Date | null => {
        if (!date) return null;
        return new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            23, 59, 59, 999
        );
    },

    // 날짜를 분 단위로 정규화 (초/밀리초 제거)
    toMinute: (date: Date | null): Date | null => {
        if (!date) return null;
        return new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            date.getHours(),
            date.getMinutes(),
            0, 0
        );
    },

    // 두 날짜의 범위 체크 (분 단위)
    isInRangeByMinute: (
        cellTime: number,
        startAt: Date | null,
        endAt: Date | null
    ): boolean => {
        if (!startAt || !endAt) return false;

        const start = DateUtils.toMinute(startAt)?.getTime() ?? null;
        const end = DateUtils.toMinute(endAt)?.getTime() ?? null;

        if (start === null || end === null) return false;

        const min = Math.min(start, end);
        const max = Math.max(start, end);

        return cellTime >= min && cellTime <= max;
    },

    // 두 날짜의 범위 체크 (일 단위)
    isInRangeByDay: (
        cellTime: number,
        startAt: Date | null,
        endAt: Date | null
    ): boolean => {
        if (!startAt || !endAt) return false;

        const start = DateUtils.toStartOfDay(startAt)?.getTime() ?? null;
        const end = DateUtils.toStartOfDay(endAt)?.getTime() ?? null;

        if (start === null || end === null) return false;

        const min = Math.min(start, end);
        const max = Math.max(start, end);

        return cellTime >= min && cellTime <= max;
    }
};
