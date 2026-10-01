import Reservation from "../models/Reservation.js"
import Terrain from "../models/Terrain.js"
import { toMinutes } from "./slot.js"


export async function filterFreeToday(objs: any[]) {
    if (objs.length === 0)
        return objs

    const objIds = objs.map(o => o._id)
    const dayStart = new Date()
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)
    const now = new Date()
    const firstBookableHour = now.getHours() + 1

    const terrains = await Terrain.find({ objectId: { $in: objIds } }).select("objectId")
    const terrainIds = terrains.map(t => t._id)
    const reservations = await Reservation.find({
        resourceId: { $in: terrainIds },
        date: { $gte: dayStart, $lt: dayEnd },
        status: { $in: ["pending", "confirmed"] }
    }).select("resourceId startTime endTime")

    const bookedByTerrain: Record<string, Set<number>> = {}
    for (const r of reservations) {
        const key = String(r.resourceId)
        if (!bookedByTerrain[key])
            bookedByTerrain[key] = new Set<number>()
        const start = Math.floor(toMinutes(r.startTime as string) / 60)
        const end = Math.floor(toMinutes(r.endTime as string) / 60)
        for (let hour = start; hour < end; hour++) {
            bookedByTerrain[key]!.add(hour)
        }
    }

    const terrainsByObject: Record<string, any[]> = {}
    for (const terrain of terrains) {
        const key = String(terrain.objectId)
        if (!terrainsByObject[key])
            terrainsByObject[key] = []
        terrainsByObject[key]!.push(terrain)
    }

    return objs.filter(o => {
        const openHour = parseInt(o.workingHours?.open || "0")
        const closeHour = parseInt(o.workingHours?.close || "0")
        const startHour = Math.max(openHour, firstBookableHour)
        if (startHour >= closeHour)
            return false
        const objectTerrains = terrainsByObject[String(o._id)] || []
        for (const terrain of objectTerrains) {
            const booked = bookedByTerrain[String(terrain._id)] || new Set<number>()
            for (let hour = startHour; hour < closeHour; hour++) {
                if (!booked.has(hour))
                    return true
            }
        }
        return false
    })
}