import type { Request, Response } from "express"
import Rating from "../models/Rating.js"
import Terrain from "../models/Terrain.js"
import Reservation from "../models/Reservation.js"
import SportObject from "../models/SportObject.js"

function confirmedReservationCount(userId: string, objectId: string): Promise<number> {
    return Terrain.find({ objectId }).distinct("_id").then(ids =>
        Reservation.countDocuments({ userId, resourceId: { $in: ids }, status: "confirmed" })
    )
}

export class RatingController {

    getForObject = (req: Request, res: Response) => {
        const objectId = req.params.objectId as string
        const userId = req.user?.userId || ""

        Rating.find({ objectId }).populate("userId", "firstName lastName").sort({ createdAt: -1 }).then((list: any[]): any => {
            const likeCount = list.filter(r => r.like).length
            const dislikeCount = list.filter(r => !r.like).length
            const comments = list.filter(r => r.comment && r.comment.trim() !== "").slice(0, 5).map(r => ({
                _id: r._id,
                like: r.like,
                comment: r.comment,
                createdAt: r.createdAt,
                userName: `${r.userId?.firstName || ""} ${r.userId?.lastName || ""}`.trim(),
                own: userId !== "" && String(r.userId?._id) === userId
            }))

            if (!userId)
                return res.json({ likeCount, dislikeCount, comments, canRate: false, used: 0, allowed: 0 })

            const used = list.filter(r => String(r.userId?._id) === userId).length
            return confirmedReservationCount(userId, objectId).then(allowed => {
                res.json({
                    likeCount,
                    dislikeCount,
                    comments,
                    canRate: req.user?.role === "sportista" && used < allowed,
                    used,
                    allowed
                })
            })
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    create = (req: Request, res: Response) => {
        const userId = req.user?.userId || ""
        const { objectId, like, comment } = req.body || {}
        if (!objectId || typeof like !== "boolean")
            return res.json({ error: "Nedostaju podaci o oceni." })

        const text = (comment || "").toString().trim()
        if (text.length > 300)
            return res.json({ error: "Komentar može imati najviše 300 karaktera." })

        SportObject.findOne({ _id: objectId, status: "approved" }).then((obj: any): any => {
            if (!obj)
                return res.json({ error: "Objekat nije pronađen." })
            return confirmedReservationCount(userId, objectId).then((allowed: number): any => {
                if (allowed === 0)
                    return res.json({ error: "Ocenu možete ostaviti samo ako imate potvrđenu rezervaciju u ovom objektu." })
                return Rating.countDocuments({ objectId, userId }).then((used: number): any => {
                    if (used >= allowed)
                        return res.json({ error: "Iskoristili ste maksimalan broj ocena za ovaj objekat." })
                    return Rating.create({ objectId, userId, like, comment: text }).then(() =>
                        res.json({ message: "Ocena je sačuvana." })
                    )
                })
            })
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }
}
