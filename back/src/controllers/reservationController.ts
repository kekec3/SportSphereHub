import type { Request, Response } from "express";
import Reservation from "../models/Reservation.js";
import { isCancellable, isInConfirmWindow } from "../utils/reservation.js"
import Terrain from "../models/Terrain.js";
import { validateReservationTimes } from "../validators/reservationValidator.js";
import User from "../models/User.js";
import { isSlotFree } from "../utils/slot.js";
import SportObject from "../models/SportObject.js"

function toMinutesHour(t: string): number {
    return Number(String(t).split(":")[0]) || 0
}

export class ReservationController {

    getMine = (req: Request, res: Response) => {
        const userId = req.user?.userId || ''
        Reservation.find({ userId }).populate({
            path: "resourceId",
            select: "name type objectId sports",
            populate: [
                { path: "objectId", select: "name city" },
                { path: "sports", select: "name" }
            ]

        }).sort({ date: -1, startTime: -1 }).then((list: any[]) => {
            const out = list.map(r => {
                const terrain: any = r.resourceId || {}
                const object: any = terrain.objectId || {}
                return {
                    _id: r._id,
                    date: r.date,
                    startTime: r.startTime,
                    endTime: r.endTime,
                    status: r.status,
                    resourceName: terrain.name || "—",
                    sportNames: (terrain.sports || []).map((s: any) => s.name).join(", "),
                    resourceType: terrain.type || "",
                    objectName: object.name || "—",
                    objectCity: object.city || "",
                    cancellable: isCancellable(r)
                }
            })
            res.json(out)
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    cancel = (req: Request, res: Response) => {
        const userId = req.user?.userId || ''
        const id = req.params.id as string
        Reservation.findOne({ _id: id, userId }).then((r: any) => {
            if (!r)
                return res.json({ error: "Rezervacija nije pronađena." })
            if (!isCancellable(r))
                return res.json({ error: "Rezervacija se ne može otkazati (manje od 12h do početka)." })
            r.status = "cancelled"
            return r.save().then(() => res.json({ message: "Rezervacija je uspešno otkazana." }))
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    getCalendar = (req: Request, res: Response) => {
        const resourceId = req.params.id as string
        const weekStartStr = req.query.weekStart as string
        const weekStart = weekStartStr ? new Date(weekStartStr) : new Date()
        weekStart.setHours(0, 0, 0, 0)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 7)

        Terrain.findById(resourceId).populate("objectId", "workingHours name").then((terrain: any): any => {
            if (!terrain)
                return res.json(null)
            return Reservation.find({
                resourceId,
                date: { $gte: weekStart, $lt: weekEnd },
                status: { $in: ["pending", "confirmed"] }
            }).populate("userId", "firstName lastName username").then((list: any[]) => {
                res.json({
                    resourceId,
                    workingHours: terrain.objectId?.workingHours || { open: "08:00", close: "22:00" },
                    reservations: list.map((r: any) => {
                        const user: any = r.userId || {}
                        return {
                            _id: r._id,
                            date: r.date,
                            startTime: r.startTime,
                            endTime: r.endTime,
                            status: r.status,
                            userName: (user.firstName || user.lastName) ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : (user.username || "—")
                        }
                    })
                })
            })
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    create = (req: Request, res: Response) => {
        const userId = req.user?.userId || ''
        const { resourceId, date, startTime, endTime } = req.body || {}
        if (!resourceId || !date || !startTime || !endTime)
            return res.json({ error: "Nedostaju podaci o rezervaciji." })

        const err = validateReservationTimes(startTime, endTime)
        if (err)
            return res.json({ error: err })

        const day = new Date(date)
        day.setHours(0, 0, 0, 0)

        const start = new Date(day)
        start.setHours(toMinutesHour(startTime), 0, 0, 0)
        if (start.getTime() < Date.now())
            return res.json({ error: "Ne možete rezervisati termin u prošlosti." })

        Terrain.findById(resourceId).then((terrain: any): any => {
            if (!terrain)
                return res.json({ error: "Teren ne postoji." })
            return User.findById(userId).then((user: any): any => {
                const blocked = (user?.blockedFromObjects || []).some((o: any) => String(o) === String(terrain.objectId))
                if (blocked)
                    return res.json({ error: "Blokirani ste za rezervacije u ovom objektu." })
                return isSlotFree(resourceId, day, startTime, endTime).then((free: boolean): any => {
                    if (!free)
                        return res.json({ error: "Termin je već zauzet." })
                    return Reservation.create({ resourceId, userId, date: day, startTime, endTime }).then(r => {
                        res.json({ message: "Uspešno ste rezervisali termin.", reservation: r })
                    })
                })
            })
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    listForOwner = (req: Request, res: Response) => {
        const userId = req.user?.userId || ""
        const objectFilter = req.query.object as string
        SportObject.find({ ownerIds: userId }).select("_id").then((objs: any[]) => {
            let objIds = objs.map(o => o._id)
            if (objectFilter)
                objIds = objIds.filter(id => String(id) === objectFilter)
            return Terrain.find({ objectId: { $in: objIds } }).select("_id").then((terrains: any[]) => {
                const terrIds = terrains.map(t => t._id)
                return Reservation.find({ resourceId: { $in: terrIds } })
                    .populate({ path: "userId", select: "firstName lastName username" })
                    .populate({ path: "resourceId", select: "name objectId", populate: { path: "objectId", select: "name" } })
                    .sort({ date: -1, startTime: -1 })
                    .then((list: any[]) => {
                        res.json(list.map(r => {
                            const terrain: any = r.resourceId || {}
                            const object: any = terrain.objectId || {}
                            const u: any = r.userId || {}
                            return {
                                _id: r._id,
                                date: r.date,
                                startTime: r.startTime,
                                endTime: r.endTime,
                                status: r.status,
                                resourceName: terrain.name || "—",
                                objectName: object.name || "—",
                                userName: (u.firstName || u.lastName) ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : (u.username || "—"),
                                actionable: r.status === "pending" && isInConfirmWindow(r)
                            }
                        }))
                    })
            })
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    ownedReservation = (id: string, userId: string): Promise<any> => {
        return Reservation.findById(id).then((r: any) => {
            if (!r)
                return null
            return Terrain.findById(r.resourceId).then((t: any) => {
                if (!t)
                    return null
                return SportObject.findOne({ _id: t.objectId, ownerIds: userId }).then((obj: any) => obj ? { r, objectId: t.objectId } : null)
            })
        })
    }

    confirm = (req: Request, res: Response) => {
        const userId = req.user?.userId || ""
        const id = req.params.id as string
        this.ownedReservation(id, userId).then((ctx: any): any => {
            if (!ctx)
                return res.json({ error: "Rezervacija nije pronađena." })
            const r = ctx.r
            if (r.status !== "pending")
                return res.json({ error: "Rezervacija je već obrađena." })
            if (!isInConfirmWindow(r))
                return res.json({ error: "Potvrda je moguća samo u roku od 10 minuta od početka termina." })
            r.status = "confirmed"
            return r.save().then(() => res.json({ message: "Rezervacija je potvrđena." }))
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    noShow = (req: Request, res: Response) => {
        const userId = req.user?.userId || ""
        const id = req.params.id as string
        this.ownedReservation(id, userId).then((ctx: any): any => {
            if (!ctx)
                return res.json({ error: "Rezervacija nije pronađena." })
            const r = ctx.r
            const objectId = ctx.objectId
            if (r.status !== "pending")
                return res.json({ error: "Rezervacija je već obrađena." })
            if (!isInConfirmWindow(r))
                return res.json({ error: "Nedolazak se može označiti samo u roku od 10 minuta od početka termina." })
            r.status = "no-show"
            return r.save().then(() => {
                return Promise.all([SportObject.findById(objectId), User.findById(r.userId)]).then(([obj, user]: any[]) => {
                    if (!obj || !user)
                        return res.json({ message: "Rezervacija je označena kao nedolazak." })
                    const entry = user.noShowCounts.find((n: any) => String(n.objectId) === String(objectId))
                    let count: number
                    if (entry) {
                        entry.count += 1
                        count = entry.count
                    } else {
                        user.noShowCounts.push({ objectId, count: 1 })
                        count = 1
                    }
                    let blocked = false
                    if (count >= obj.maxNoShows && !user.blockedFromObjects.some((b: any) => String(b) === String(objectId))) {
                        user.blockedFromObjects.push(objectId)
                        blocked = true
                    }
                    return user.save().then(() => res.json({
                        message: `Nedolazak zabeležen (${count}/${obj.maxNoShows}).` + (blocked ? " Korisnik je blokiran za ovaj objekat." : "")
                    }))
                })
            })
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    move = (req: Request, res: Response) => {
        const userId = req.user?.userId || ""
        const id = req.params.id as string
        const { date, startTime, endTime } = req.body || {}
        if (!date || !startTime || !endTime)
            return res.json({ error: "Nedostaju podaci o terminu." })

        const timeErr = validateReservationTimes(startTime, endTime)
        if (timeErr)
            return res.json({ error: timeErr })

        Reservation.findById(id).then((reservation: any): any => {
            if (!reservation)
                return res.json({ error: "Rezervacija nije pronađena." })
            if (reservation.status !== "pending" && reservation.status !== "confirmed")
                return res.json({ error: "Rezervacija se ne može pomeriti." })
            return Terrain.findById(reservation.resourceId).then((terrain: any): any => {
                if (!terrain)
                    return res.json({ error: "Teren ne postoji." })
                return SportObject.findOne({ _id: terrain.objectId, ownerIds: userId }).then((obj: any): any => {
                    if (!obj)
                        return res.json({ error: "Nemate pristup ovoj rezervaciji." })
                    if (terrain.type === "open")
                        return res.json({ error: "Prevlačenje je dozvoljeno samo za zatvorene terene i hale." })

                    const day = new Date(date)
                    day.setHours(0, 0, 0, 0)
                    const startDt = new Date(day)
                    startDt.setHours(Number(String(startTime).split(":")[0]) || 0, 0, 0, 0)
                    if (startDt.getTime() < Date.now())
                        return res.json({ error: "Ne možete pomeriti termin u prošlost." })

                    return isSlotFree(reservation.resourceId, day, startTime, endTime, reservation._id).then((free: boolean): any => {
                        if (!free)
                            return res.json({ error: "Termin je već zauzet." })
                        reservation.date = day
                        reservation.startTime = startTime
                        reservation.endTime = endTime
                        return reservation.save().then(() => res.json({ message: "Rezervacija je pomerena." }))
                    })
                })
            })
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }
}