import type { Request, Response } from "express"
import Training from "../models/Training.js"
import Coach from "../models/Coach.js"
import { validateReservationTimes } from "../validators/reservationValidator.js"
import { toMinutes } from "../utils/slot.js"
import SportObject from "../models/SportObject.js"

function startDateTime(date: any, startTime: string): Date {
    const d = new Date(date)
    d.setHours(Number(String(startTime).split(":")[0]) || 0, 0, 0, 0)
    return d
}

export class TrainingController {

    create = (req: Request, res: Response) => {
        const userId = req.user?.userId || ""
        const { coachId, date, startTime, endTime } = req.body || {}
        if (!coachId || !date || !startTime || !endTime)
            return res.json({ error: "Nedostaju podaci o treningu." })

        const timeErr = validateReservationTimes(startTime, endTime)
        if (timeErr)
            return res.json({ error: timeErr })

        const day = new Date(date)
        if (isNaN(day.getTime()))
            return res.json({ error: "Neispravan datum." })
        day.setHours(0, 0, 0, 0)

        if (startDateTime(day, startTime).getTime() < Date.now())
            return res.json({ error: "Ne možete zakazati trening u prošlosti." })

        Coach.findById(coachId).then((coach: any): any => {
            if (!coach || !coach.active)
                return res.json({ error: "Trener nije dostupan." })

            return Training.find({ coachId, date: day, status: "scheduled" }).then((existing: any[]): any => {
                const start = toMinutes(startTime)
                const end = toMinutes(endTime)
                const clash = existing.some(t => start < toMinutes(t.endTime) && toMinutes(t.startTime) < end)
                if (clash)
                    return res.json({ error: "Trener je već zauzet u izabranom terminu." })

                return Training.create({ coachId, sportistaId: userId, date: day, startTime, endTime }).then(t => {
                    res.json({ message: "Trening je zakazan.", training: t })
                })
            })
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    mine = (req: Request, res: Response) => {
        const userId = req.user?.userId || ""
        Training.find({ sportistaId: userId }).populate({
            path: "coachId",
            select: "name specialization sport objectId",
            populate: [
                { path: "sport", select: "name" },
                { path: "objectId", select: "name city" }
            ]
        }).sort({ date: -1, startTime: -1 }).then((list: any[]) => {
            const now = Date.now()
            const out = list.map(t => {
                const coach: any = t.coachId || {}
                const upcoming = startDateTime(t.date, t.startTime).getTime() >= now
                return {
                    _id: t._id,
                    date: t.date,
                    startTime: t.startTime,
                    endTime: t.endTime,
                    status: t.status,
                    coachName: coach.name || "—",
                    specialization: coach.specialization || "",
                    sportName: coach.sport?.name || "",
                    objectName: coach.objectId?.name || "—",
                    objectCity: coach.objectId?.city || "",
                    upcoming,
                    cancellable: t.status === "scheduled" && upcoming
                }
            })
            res.json(out)
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    cancel = (req: Request, res: Response) => {
        const userId = req.user?.userId || ""
        const id = req.params.id as string
        Training.findOne({ _id: id, sportistaId: userId }).then((t: any): any => {
            if (!t)
                return res.json({ error: "Trening nije pronađen." })
            if (t.status !== "scheduled")
                return res.json({ error: "Trening se ne može otkazati." })
            if (startDateTime(t.date, t.startTime).getTime() < Date.now())
                return res.json({ error: "Prošli trening se ne može otkazati." })
            t.status = "cancelled"
            return t.save().then(() => res.json({ message: "Trening je otkazan." }))
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    listForOwner = (req: Request, res: Response) => {
        const userId = req.user?.userId || ""
        SportObject.find({ ownerIds: userId }).select("_id").then((objs: any[]) => {
            const objIds = objs.map(o => o._id)
            return Coach.find({ objectId: { $in: objIds } }).select("_id").then((coaches: any[]) => {
                const coachIds = coaches.map(c => c._id)
                return Training.find({ coachId: { $in: coachIds } })
                    .populate({ path: "coachId", select: "name sport objectId", populate: [{ path: "sport", select: "name" }, { path: "objectId", select: "name" }] })
                    .populate({ path: "sportistaId", select: "firstName lastName username" })
                    .sort({ date: -1, startTime: -1 })
                    .then((list: any[]) => {
                        res.json(list.map(t => {
                            const coach: any = t.coachId || {}
                            const u: any = t.sportistaId || {}
                            return {
                                _id: t._id,
                                date: t.date,
                                startTime: t.startTime,
                                endTime: t.endTime,
                                status: t.status,
                                coachName: coach.name || "—",
                                sportName: coach.sport?.name || "",
                                objectName: coach.objectId?.name || "—",
                                userName: (u.firstName || u.lastName) ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : (u.username || "—")
                            }
                        }))
                    })
            })
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }
}

