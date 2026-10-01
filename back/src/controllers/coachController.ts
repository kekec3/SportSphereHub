import type { Request, Response } from "express"
import Coach from "../models/Coach.js"

export class CoachController {

    list = (req: Request, res: Response) => {
        const object = req.query.object as string
        const sport = req.query.sport as string

        const filter: any = { active: true }
        if (object)
            filter.objectId = object
        if (sport)
            filter.sport = sport

        Coach.find(filter).populate("objectId", "name city").populate("sport", "name").sort({ name: 1 }).then(list => {
            res.json(list)
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    adminList = (req: Request, res: Response) => {
        Coach.find().populate("objectId", "name city").populate("sport", "name").sort({ name: 1 }).then(list => {
            res.json(list)
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    create = (req: Request, res: Response) => {
        const body = req.body || {}
        if (!body.name || !String(body.name).trim())
            return res.json({ error: "Ime trenera je obavezno." })
        if (!body.objectId)
            return res.json({ error: "Objekat je obavezan." })
        if (!body.sport)
            return res.json({ error: "Sport je obavezan." })
        if (!body.specialization || !String(body.specialization).trim())
            return res.json({ error: "Specijalnost je obavezna." })
        const price = Number(body.pricePerHour)
        if (!Number.isFinite(price) || price < 0)
            return res.json({ error: "Cena mora biti broj ≥ 0." })
        Coach.create({
            name: String(body.name).trim(),
            objectId: body.objectId,
            sport: body.sport,
            specialization: String(body.specialization).trim(),
            pricePerHour: price
        }).then(coach => res.json({ message: "Trener je dodat.", coach })).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    toggleActive = (req: Request, res: Response) => {
        const id = req.params.id as string
        Coach.findById(id).then((coach: any): any => {
            if (!coach)
                return res.json({ error: "Trener nije pronađen." })
            coach.active = !coach.active
            return coach.save().then(() => res.json({ message: coach.active ? "Trener je aktiviran." : "Trener je deaktiviran." }))
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }
}