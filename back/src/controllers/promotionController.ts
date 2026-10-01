import type { Request, Response } from "express"
import Promotion from "../models/Promotion.js"
import SportObject from "../models/SportObject.js"

function validatePromotion(b: any): string | null {
    if (!b.name || !String(b.name).trim())
        return "Naziv promocije je obavezan."
    if (!b.objectId)
        return "Objekat je obavezan."
    if (!b.sport)
        return "Sport je obavezan."
    if (b.discountType !== "percent" && b.discountType !== "fixed")
        return "Neispravan tip popusta."
    const val = Number(b.value)
    if (!Number.isFinite(val) || val <= 0)
        return "Vrednost popusta mora biti veća od 0."
    if (b.discountType === "percent" && val > 100)
        return "Procenat popusta ne može biti veći od 100."
    const from = new Date(b.validFrom)
    const to = new Date(b.validTo)
    if (isNaN(from.getTime()) || isNaN(to.getTime()))
        return "Neispravni datumi."
    if (from >= to)
        return "Datum početka mora biti pre datuma isteka."
    return null
}

export class PromotionController {

    getActive = (req: Request, res: Response) => {
        const limit = parseInt(req.query.limit as string) || 3
        const now = new Date()

        Promotion.find({ validFrom: { $lte: now }, validTo: { $gte: now } })
            .sort({ validTo: 1 })
            .limit(limit)
            .populate("objectId", "name city")
            .populate("sport", "name")
            .then(promos => {
                res.json(promos)
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
            return Promotion.find({ objectId: { $in: objIds } })
                .populate("objectId", "name")
                .populate("sport", "name")
                .sort({ validTo: -1 })
                .then(list => res.json(list))
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    create = (req: Request, res: Response) => {
        const userId = req.user?.userId || ""
        const b = req.body || {}
        const err = validatePromotion(b)
        if (err)
            return res.json({ error: err })
        SportObject.findOne({ _id: b.objectId, ownerIds: userId }).then((obj: any): any => {
            if (!obj)
                return res.json({ error: "Objekat nije pronađen." })
            return Promotion.create({
                objectId: b.objectId,
                name: String(b.name).trim(),
                sport: b.sport,
                discountType: b.discountType,
                value: Number(b.value),
                validFrom: new Date(b.validFrom),
                validTo: new Date(b.validTo)
            }).then(p => res.json({ message: "Promocija je kreirana.", promotion: p }))
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    update = (req: Request, res: Response) => {
        const userId = req.user?.userId || ""
        const id = req.params.id as string
        const b = req.body || {}
        const err = validatePromotion(b)
        if (err)
            return res.json({ error: err })
        Promotion.findById(id).then((p: any): any => {
            if (!p)
                return res.json({ error: "Promocija nije pronađena." })
            return SportObject.findOne({ _id: p.objectId, ownerIds: userId }).then((obj: any): any => {
                if (!obj)
                    return res.json({ error: "Nemate pristup ovoj promociji." })
                p.name = String(b.name).trim()
                p.sport = b.sport
                p.discountType = b.discountType
                p.value = Number(b.value)
                p.validFrom = new Date(b.validFrom)
                p.validTo = new Date(b.validTo)
                return p.save().then(() => res.json({ message: "Promocija je izmenjena." }))
            })
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    remove = (req: Request, res: Response) => {
        const userId = req.user?.userId || ""
        const id = req.params.id as string
        Promotion.findById(id).then((p: any): any => {
            if (!p)
                return res.json({ error: "Promocija nije pronađena." })
            return SportObject.findOne({ _id: p.objectId, ownerIds: userId }).then((obj: any): any => {
                if (!obj)
                    return res.json({ error: "Nemate pristup ovoj promociji." })
                return Promotion.deleteOne({ _id: id }).then(() => res.json({ message: "Promocija je obrisana." }))
            })
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }
}
