import type { Request, Response } from "express"
import mongoose from "mongoose"
import Reservation from "../models/Reservation.js"
import Order from "../models/Order.js"

export class StatsController {

    dashboard = (req: Request, res: Response) => {
        const userId = new mongoose.Types.ObjectId(req.user?.userId)

        const perSport = Reservation.aggregate([
            { $match: { userId, status: { $ne: "cancelled" } } },
            { $lookup: { from: "tereni", localField: "resourceId", foreignField: "_id", as: "teren" } },
            { $unwind: "$teren" },
            { $unwind: "$teren.sports" },
            { $group: { _id: "$teren.sports", count: { $sum: 1 } } },
            { $lookup: { from: "sport", localField: "_id", foreignField: "_id", as: "sport" } },
            { $unwind: "$sport" },
            { $project: { _id: 0, sport: "$sport.name", count: 1 } },
            { $sort: { count: -1 } }
        ])

        const perMonth = Reservation.aggregate([
            { $match: { userId, status: { $ne: "cancelled" } } },
            { $group: { _id: { y: { $year: { date: "$date", timezone: "Europe/Belgrade" } }, m: { $month: { date: "$date", timezone: "Europe/Belgrade" } } }, count: { $sum: 1 } } },
            { $sort: { "_id.y": 1, "_id.m": 1 } }
        ])

        const globalSpend = Order.aggregate([
            { $match: { status: { $ne: "cancelled" } } },
            { $unwind: "$items" },
            { $group: { _id: null, total: { $sum: { $multiply: ["$items.priceAtOrder", "$items.quantity"] } } } }
        ])

        const mySpend = Order.aggregate([
            { $match: { userId, status: { $ne: "cancelled" } } },
            { $unwind: "$items" },
            { $group: { _id: null, total: { $sum: { $multiply: ["$items.priceAtOrder", "$items.quantity"] } } } }
        ])

        Promise.all([perSport, perMonth, globalSpend, mySpend]).then(([ps, pm, gs, ms]: any[]) => {
            const months = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Avg", "Sep", "Okt", "Nov", "Dec"]
            const monthlyOut = pm.map((x: any) => ({
                label: `${months[x._id.m - 1] ?? ""} ${String(x._id.y).slice(2)}`,
                count: x.count
            }))
            res.json({
                perSport: ps,
                perMonth: monthlyOut,
                globalSpend: gs[0]?.total ?? 0,
                mySpend: ms[0]?.total ?? 0
            })
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }
}