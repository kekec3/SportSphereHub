import { toMinutes } from "../utils/slot.js"

export function validateReservationTimes(startTime: string, endTime: string): string | null {
    const onHour = /^([01]\d|2[0-3]):00$/
    if (!onHour.test(startTime) || !onHour.test(endTime))
        return "Termin mora počinjati i završavati se na pun sat."
    const startMin = toMinutes(startTime)
    const endMin = toMinutes(endTime)
    if (endMin <= startMin)
        return "Kraj termina mora biti posle početka."
    if (endMin - startMin < 60)
        return "Minimalno trajanje termina je 1 sat."
    return null
}