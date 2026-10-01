import type { Request, Response } from "express"
import Equipment from "../models/Equipment.js"
import SportObject from "../models/SportObject.js"

function validateEquipment(b: any): string | null {
    if (!b.name || !String(b.name).trim())
        return "Naziv opreme je obavezan."
    if (!b.objectId)
        return "Objekat je obavezan."
    if (!b.sport)
        return "Sport je obavezan."
    const price = Number(b.price)
    if (!Number.isFinite(price) || price < 0)
        return "Cena mora biti broj ≥ 0."
    const stock = Number(b.stock)
    if (!Number.isInteger(stock) || stock < 0)
        return "Zalihe moraju biti ceo broj ≥ 0."
    return null
}

export class EquipmentController {

    list = (req: Request, res: Response) => {
        const sport = req.query.sport as string
        const object = req.query.object as string

        const filter: any = {}
        if (sport)
            filter.sport = sport
        if (object)
            filter.objectId = object

        Equipment.find(filter).populate("sport", "name").populate("objectId", "name city").sort({ name: 1 }).then(list => {
            res.json(list)
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
            return Equipment.find({ objectId: { $in: objIds } })
                .populate("sport", "name")
                .populate("objectId", "name")
                .sort({ name: 1 })
                .then(list => res.json(list))
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    create = (req: Request, res: Response) => {
        const userId = req.user?.userId || ""
        const b = req.body || {}
        const err = validateEquipment(b)
        if (err)
            return res.json({ error: err })
        SportObject.findOne({ _id: b.objectId, ownerIds: userId }).then((obj: any): any => {
            if (!obj)
                return res.json({ error: "Objekat nije pronađen." })
            return Equipment.create({
                objectId: b.objectId,
                sport: b.sport,
                name: String(b.name).trim(),
                image: b.image ? String(b.image) : "",
                price: Number(b.price),
                stock: Number(b.stock)
            }).then(e => res.json({ message: "Oprema je dodata.", equipment: e }))
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    update = (req: Request, res: Response) => {
        const userId = req.user?.userId || ""
        const id = req.params.id as string
        const b = req.body || {}
        const err = validateEquipment(b)
        if (err)
            return res.json({ error: err })
        Equipment.findById(id).then((e: any): any => {
            if (!e)
                return res.json({ error: "Oprema nije pronađena." })
            return SportObject.findOne({ _id: e.objectId, ownerIds: userId }).then((obj: any): any => {
                if (!obj)
                    return res.json({ error: "Nemate pristup ovoj opremi." })
                e.name = String(b.name).trim()
                e.sport = b.sport
                e.price = Number(b.price)
                e.stock = Number(b.stock)
                if (typeof b.image === "string")
                    e.image = b.image
                return e.save().then(() => res.json({ message: "Oprema je izmenjena." }))
            })
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    remove = (req: Request, res: Response) => {
        const userId = req.user?.userId || ""
        const id = req.params.id as string
        Equipment.findById(id).then((e: any): any => {
            if (!e)
                return res.json({ error: "Oprema nije pronađena." })
            return SportObject.findOne({ _id: e.objectId, ownerIds: userId }).then((obj: any): any => {
                if (!obj)
                    return res.json({ error: "Nemate pristup ovoj opremi." })
                return Equipment.deleteOne({ _id: id }).then(() => res.json({ message: "Oprema je obrisana." }))
            })
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }
}