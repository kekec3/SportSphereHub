import type { Request, Response } from "express"
import Teammate from "../models/Teammate.js"
import JoinRequest from "../models/JoinRequest.js"

export class TeammateController {

    listActive = (req: Request, res: Response) => {
        const userId = req.user?.userId || ""
        const sport = req.query.sport as string
        const city = req.query.city as string
        const date = req.query.date as string

        JoinRequest.find({ requesterId: userId }).then((myReqs: any[]): any => {
            const statusByAd: any = {}
            myReqs.forEach(r => {
                statusByAd[String(r.adId)] = r.status
            })
            const requestedIds = myReqs.map(r => r.adId)

            const active: any = { status: "active" }
            if (sport) active.sport = sport
            if (city) active.city = { $regex: city, $options: "i" }
            if (date) {
                const day = new Date(date)
                if (isNaN(day.getTime())) {
                    day.setHours(0, 0, 0, 0)
                    const next = new Date(day)
                    next.setDate(next.getDate() + 1)
                    active.date = { $gte: day, $lt: next }
                }
            }

            const filter: any = { $or: [active, { _id: { $in: requestedIds } }] }

            return Teammate.find(filter).populate("sportistaId", "firstName lastName").populate("sport", "name").sort({ date: 1 }).then(ads => {
                res.json(ads.map((a: any) => ({
                    _id: a._id,
                    sport: a.sport,
                    city: a.city,
                    date: a.date,
                    time: a.time,
                    missingPlayers: a.missingPlayers,
                    status: a.status,
                    sportista: a.sportistaId,
                    mine: String(a.sportistaId?._id) === userId,
                    requestStatus: statusByAd[String(a._id)] || null
                })))
            })
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    mine = (req: Request, res: Response) => {
        const userId = req.user?.userId || ""
        Teammate.find({ sportistaId: userId }).populate("sport", "name").sort({ date: -1 }).then((ads: any[]): any => {
            const adIds = ads.map(a => a._id)
            return JoinRequest.find({ adId: { $in: adIds } }).populate("requesterId", "firstName lastName").then(reqs => {
                const byAd: any = {}
                reqs.forEach((r: any) => {
                    const k = String(r.adId);
                    if (!byAd[k])
                        byAd[k] = []
                    byAd[k].push({ _id: r._id, status: r.status, requester: r.requesterId })
                })
                res.json(ads.map(a => ({
                    _id: a._id,
                    sport: a.sport,
                    city: a.city,
                    date: a.date,
                    time: a.time,
                    missingPlayers: a.missingPlayers,
                    status: a.status,
                    requests: byAd[String(a._id)] || []
                })))
            })
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    create = (req: Request, res: Response) => {
        const userId = req.user?.userId || ""
        const { sport, city, date, time, missingPlayers } = req.body || {}
        if (!sport || !city || !date || !time || missingPlayers == null)
            return res.json({ error: "Sva polja su obavezna." })

        const missing = Number(missingPlayers)
        if (!Number.isInteger(missing) || missing < 1)
            return res.json({ error: "Broj saigrača mora biti ceo broj veći od 0." })

        const day = new Date(date)
        if (isNaN(day.getTime()))
            return res.json({ error: "Neispravan datum." })

        Teammate.create({ sportistaId: userId, sport, city, date: day, time, missingPlayers: missing }).then(() => {
            res.json({ message: "Oglas je objavljen." })
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    close = (req: Request, res: Response) => {
        const userId = req.user?.userId || ""
        const id = req.params.id as string
        Teammate.findOne({ _id: id, sportistaId: userId }).then((ad: any): any => {
            if (!ad)
                return res.json({ error: "Oglas nije pronađen." })
            ad.status = "closed"
            return ad.save().then(() => {
                res.json({ message: "Oglas je zatvoren." })
            })
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    join = (req: Request, res: Response) => {
        const userId = req.user?.userId || ""
        const adId = req.params.id as string
        Teammate.findById(adId).then((ad: any): any => {
            if (!ad || ad.status !== "active")
                return res.json({ error: "Oglas nije dostupan." })
            if (String(ad.sportistaId) === userId)
                return res.json({ error: "Ne možete se pridružiti sopstvenom oglasu." })
            return JoinRequest.findOne({ adId, requesterId: userId }).then((existing: any): any => {
                if (existing)
                    return res.json({ error: "Već ste poslali zahtev za ovaj oglas." })
                return JoinRequest.create({ adId, requesterId: userId }).then(() => {
                    res.json({ message: "Zahtev je poslat." })
                })
            })
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    respond = (req: Request, res: Response) => {
        const userId = req.user?.userId || ""
        const reqId = req.params.id as string
        const action = req.body?.action
        if (action !== "approved" && action !== "rejected")
            return res.json({ error: "Nepoznata akcija." })

        JoinRequest.findById(reqId).populate("adId").then((req: any): any => {
            if (!req || !req.adId)
                return res.json({ error: "Zahtev nije pronađen." })
            const ad = req.adId
            if (String(ad.sportistaId) !== userId)
                return res.status(403).json({ error: "Nemate pristup ovom zahtevu." })
            if (req.status !== "pending")
                return res.json({ error: "Zahtev je već obrađen." })

            if (action === "rejected") {
                req.status = "rejected"
                return req.save().then(() => res.json({ message: "Zahtev je odbijen." }))
            }

            if (ad.status !== "active")
                return res.json({ error: "Oglas je zatvoren." })

            req.status = "approved"
            ad.missingPlayers = ad.missingPlayers - 1

            const jobs: Promise<any>[] = [req.save()]
            if (ad.missingPlayers <= 0) {
                ad.missingPlayers = 0
                ad.status = "closed"
                jobs.push(JoinRequest.updateMany(
                    { adId: ad._id, status: "pending", _id: { $ne: req._id } },
                    { status: "rejected" }
                ).exec())
            }
            jobs.push(ad.save())

            return Promise.all(jobs).then(() => {
                res.json({ message: "Zahtev je prihvaćen.", closed: ad.status === "closed" })
            })
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }
}