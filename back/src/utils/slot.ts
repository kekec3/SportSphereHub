import Reservation from "../models/Reservation.js"


export function toMinutes(t: string): number {
    const parts = String(t).split(":")
    return (Number(parts[0]) || 0) * 60 + (Number(parts[1]) || 0)
}

export async function isSlotFree(
    resourceId: string, date: Date, start: string, end: string, excludeId?: string
): Promise<boolean> {
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const q: any = {
        resourceId,
        date: { $gte: dayStart, $lt: dayEnd },
        status: { $in: ["pending", "confirmed"] }
    }
    if (excludeId)
        q._id = { $ne: excludeId }

    const existing = await Reservation.find(q)
    const startMin = toMinutes(start)
    const endMin = toMinutes(end)
    return !existing.some((r: any) => startMin < toMinutes(r.endTime) && toMinutes(r.startTime) < endMin)
}