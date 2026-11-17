import { format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export const padOffset = (n: number, padding: number): string => {
    const sign = n < 0 ? "-" : "+";
    const abs = Math.abs(n);

    return sign + abs.toString().padStart(padding, "0");
};


export const formatDate = (date?: string, dateFormat?: string) => {
    if (date === undefined || dateFormat === undefined) {
        return undefined;
    }
    return format(toZonedTime(parseISO(date), "UTC"), dateFormat);
};

export const getLocalizedDate = (
    date: string = new Date().toISOString().substring(0, 10),
    time: string = "00:00",
    timezoneOffset?: number
): Date => {
    const timezone = timezoneOffset !== undefined ? `${padOffset(timezoneOffset, 2)}:00` : undefined;
    const input = `${formatDate(date, "yyyy-MM-dd")}T${time}${timezone || ""}`;
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return toZonedTime(input, userTimeZone);
};