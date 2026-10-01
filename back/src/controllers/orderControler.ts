import type { Request, Response } from "express"
import Order from "../models/Order.js"
import Equipment from "../models/Equipment.js"
import SportObject from "../models/SportObject.js"

export class OrderController {

    create = (req: Request, res: Response) => {
        const userId = req.user?.userId || ""
        const items = req.body?.items
        if (!Array.isArray(items) || items.length === 0)
            return res.json({ error: "Korpa je prazna." })

        const ids = items.map((i: any) => i.equipmentId)
        Equipment.find({ _id: { $in: ids } }).then((eqs: any[]): any => {
            const byId: any = {}
            eqs.forEach(e => {
                byId[String(e._id)] = e
            })

            const orderItems: any[] = []
            for (const it of items) {
                const e = byId[String(it.equipmentId)]
                const qty = Number(it.quantity)
                if (!e)
                    return res.json({ error: "Neki artikli više ne postoje." })
                if (!Number.isInteger(qty) || qty < 1)
                    return res.json({ error: "Neispravna količina." })
                if (qty > e.stock)
                    return res.json({ error: `Nema dovoljno na stanju: ${e.name}.` })
                orderItems.push({ equipmentId: e._id, quantity: qty, priceAtOrder: e.price })
            }

            const updates = orderItems.map(oi =>
                Equipment.updateOne({ _id: oi.equipmentId }, { $inc: { stock: -oi.quantity } })
            )
            return Promise.all(updates).then(() =>
                Order.create({ userId, items: orderItems }).then(o =>
                    res.json({ message: "Porudžbina je kreirana.", order: o })
                )
            )
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    mine = (req: Request, res: Response) => {
        const userId = req.user?.userId || ""
        Order.find({ userId }).populate({
            path: "items.equipmentId",
            select: "name sport",
            populate: { path: "sport", select: "name" }
        }).sort({ createdAt: -1 }).then((orders: any[]) => {
            const out = orders.map(o => ({
                _id: o._id,
                status: o.status,
                createdAt: o.createdAt,
                total: o.items.reduce((s: number, i: any) => s + i.priceAtOrder * i.quantity, 0),
                items: o.items.map((i: any) => ({
                    name: i.equipmentId?.name || "—",
                    sport: i.equipmentId?.sport?.name || "",
                    quantity: i.quantity,
                    priceAtOrder: i.priceAtOrder
                })),
                cancellable: o.status === "ordered"
            }))
            res.json(out)
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    cancel = (req: Request, res: Response) => {
        const userId = req.user?.userId || ""
        const id = req.params.id as string
        Order.findOne({ _id: id, userId }).then((o: any): any => {
            if (!o)
                return res.json({ error: "Porudžbina nije pronađena." })
            if (o.status !== "ordered")
                return res.json({ error: "Porudžbina se ne može otkazati." })
            o.status = "cancelled"
            const restores = o.items.map((i: any) =>
                Equipment.updateOne({ _id: i.equipmentId }, { $inc: { stock: i.quantity } })
            )
            return Promise.all([o.save(), ...restores]).then(() =>
                res.json({ message: "Porudžbina je otkazana." })
            )
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    ownedOrder = (id: string, userId: string): Promise<any> => {
        return Order.findById(id).then((o: any) => {
            if (!o)
                return null
            const eqIds = o.items.map((i: any) => i.equipmentId)
            return Equipment.find({ _id: { $in: eqIds } }).select("objectId").then((eqs: any[]) => {
                const objIds = eqs.map(e => e.objectId)
                return SportObject.findOne({ _id: { $in: objIds }, ownerIds: userId }).then((obj: any) => obj ? o : null)
            })
        })
    }

    ownerOrders = (req: Request, res: Response) => {
        const userId = req.user?.userId || ""
        SportObject.find({ ownerIds: userId }).select("_id").then((objs: any[]) => {
            const objIds = objs.map(o => o._id)
            return Equipment.find({ objectId: { $in: objIds } }).select("_id").then((eqs: any[]) => {
                const eqIds = eqs.map(e => String(e._id))
                return Order.find({ "items.equipmentId": { $in: eqs.map(e => e._id) } })
                    .populate({ path: "userId", select: "firstName lastName username" })
                    .populate({ path: "items.equipmentId", select: "name objectId", populate: { path: "objectId", select: "name" } })
                    .sort({ createdAt: -1 })
                    .then((orders: any[]) => {
                        res.json(orders.map(o => {
                            const u: any = o.userId || {}
                            const myItems = o.items.filter((i: any) => i.equipmentId && eqIds.includes(String(i.equipmentId._id)))
                            return {
                                _id: o._id,
                                status: o.status,
                                createdAt: o.createdAt,
                                userName: (u.firstName || u.lastName) ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : (u.username || "—"),
                                items: myItems.map((i: any) => ({
                                    name: i.equipmentId?.name || "—",
                                    objectName: i.equipmentId?.objectId?.name || "",
                                    quantity: i.quantity,
                                    priceAtOrder: i.priceAtOrder
                                })),
                                myTotal: myItems.reduce((s: number, i: any) => s + i.priceAtOrder * i.quantity, 0),
                                actionable: o.status === "ordered"
                            }
                        }))
                    })
            })
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    pickup = (req: Request, res: Response) => {
        const userId = req.user?.userId || ""
        const id = req.params.id as string
        this.ownedOrder(id, userId).then((o: any): any => {
            if (!o)
                return res.json({ error: "Porudžbina nije pronađena." })
            if (o.status !== "ordered")
                return res.json({ error: "Porudžbina je već obrađena." })
            o.status = "picked-up"
            return o.save().then(() => res.json({ message: "Porudžbina je označena kao preuzeta." }))
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    decline = (req: Request, res: Response) => {
        const userId = req.user?.userId || ""
        const id = req.params.id as string
        this.ownedOrder(id, userId).then((o: any): any => {
            if (!o)
                return res.json({ error: "Porudžbina nije pronađena." })
            if (o.status !== "ordered")
                return res.json({ error: "Porudžbina se ne može otkazati." })
            o.status = "cancelled"
            const restores = o.items.map((i: any) =>
                Equipment.updateOne({ _id: i.equipmentId }, { $inc: { stock: i.quantity } })
            )
            return Promise.all([o.save(), ...restores]).then(() =>
                res.json({ message: "Porudžbina je otkazana, zalihe su vraćene." })
            )
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }
}