import type { Request, Response } from "express"
import User from "../models/User.js"
import { validateProfileUpdate } from "../validators/authValidator.js"
import { saveAvater } from "../utils/avatar.js"
import { publicUser } from "../utils/publicUser.js"
import Employee from "../models/Employee.js"
import SportObject from "../models/SportObject.js"

export class UserController {

    getMe = (req: Request, res: Response) => {
        const id = req.user?.userId
        User.findById(id).select("-passwordHash").populate("favoriteSports").then(user => {
            res.json(user || null)
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    updateMe = (req: Request, res: Response) => {
        const id = req.user?.userId
        const body = req.body || {}
        const err = validateProfileUpdate(body)
        if (err)
            return res.json({ error: err })

        const email = body.email.toLowerCase().trim()

        User.findOne({ email, _id: { $ne: id } }).then((existing: any) => {
            if (existing)
                return res.json({ error: "Email je već u upotrebi." })

            const update: any = {
                firstName: body.firstName,
                lastName: body.lastName,
                phone: body.phone,
                email,
                favoriteSports: body.favoriteSports || []

            }
            if (body.avatar)
                update.avatarUrl = saveAvater(body.avatar)

            return User.findByIdAndUpdate(id, { $set: update }, { new: true }).select("-passwordHash").populate("favoriteSports").then(user => {
                return res.json(user ? publicUser(user) : null)
            })
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    adminList = (req: Request, res: Response) => {
        User.find().select("-passwordHash").sort({ createdAt: -1 }).then((list: any[]) => {
            res.json(list.map(u => ({
                _id: u._id,
                username: u.username,
                firstName: u.firstName,
                lastName: u.lastName,
                email: u.email,
                phone: u.phone,
                role: u.role,
                status: u.status
            })))
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    adminUpdate = (req: Request, res: Response) => {
        const adminId = req.user?.userId || ""
        const id = req.params.id as string
        const body = req.body || {}
        const roles = ["sportista", "zaposleni", "admin"]
        const statuses = ["pending", "approved", "rejected"]
        if (body.role && !roles.includes(body.role))
            return res.json({ error: "Neispravna uloga." })
        if (body.status && !statuses.includes(body.status))
            return res.json({ error: "Neispravan status." })
        if (String(id) === String(adminId))
            return res.json({ error: "Ne možete menjati sopstveni nalog." })

        const update: any = {}
        if (body.role)
            update.role = body.role
        if (body.status)
            update.status = body.status
        User.findByIdAndUpdate(id, { $set: update }, { new: true }).select("-passwordHash").then((user: any) => {
            if (!user)
                return res.json({ error: "Korisnik nije pronađen." })
            res.json({ message: "Korisnik je izmenjen." })
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    adminDelete = (req: Request, res: Response) => {
        const adminId = req.user?.userId || ""
        const id = req.params.id as string
        if (String(id) === String(adminId))
            return res.json({ error: "Ne možete obrisati sopstveni nalog." })
        User.findById(id).then((user: any): any => {
            if (!user)
                return res.json({ error: "Korisnik nije pronađen." })
            return Promise.all([
                User.deleteOne({ _id: id }),
                Employee.deleteOne({ userId: id }),
                SportObject.updateMany({ ownerIds: id }, { $pull: { ownerIds: id } })
            ]).then(() => res.json({ message: "Korisnik je obrisan." }))
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }
}