import type { Request, Response } from "express";
import Sport from "../models/Sport.js";

export class SportController {
    list = (req: Request, res: Response) => {
        Sport.find().sort({ name: 1 }).then(sports => {
            res.json(sports)
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    create = (req: Request, res: Response) => {
        const name = (req.body?.name || "").trim()
        if (!name)
            return res.json({ error: "Naziv sporta je obavezan." })
        Sport.create({ name }).then(sport => {
            res.json({ message: "Sport je dodat.", sport })
        }).catch((err: any) => {
            if (err?.code === 11000)
                return res.json({ error: "Sport sa tim nazivom već postoji." })
            console.log(err)
            res.json(null)
        })
    }
}

