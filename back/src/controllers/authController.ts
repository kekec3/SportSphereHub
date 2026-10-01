import type { Request, Response } from "express";
import { validatePassword, validateRegister } from "../validators/authValidator.js";
import User from "../models/User.js";
import Registration from "../models/Registration.js";
import SportObject from "../models/SportObject.js";
import bcrypt from "bcryptjs";
import { DEFAULT_AVATAR, FRONTEND_URL, JWT_EXPIRES, JWT_SECRET, RESET_TTL_MIN, SALT_ROUNDS } from "../config.js";
import { saveAvater } from "../utils/avatar.js";
import jwt from "jsonwebtoken"
import PasswordReset from "../models/PasswordReset.js";
import crypto from "node:crypto"
import Employee from "../models/Employee.js";
import { publicUser } from "../utils/publicUser.js";

export class AuthController {

    register = (req: Request, res: Response) => {
        const body = req.body || {}
        const err = validateRegister(body)
        if (err)
            return res.json({ error: err })

        const username = body.username.trim()
        const email = body.email.toLowerCase().trim()

        Promise.all([
            User.findOne({ $or: [{ username }, { email }] }),
            Registration.findOne({ status: "pending", $or: [{ username }, { email }] })
        ]).then(([user, pendingRequest]): any => {
            if (user || pendingRequest) {
                res.json({ error: "Korisničko ime ili emejl su zauzeti." })
                return "DONE"
            }
            if (body.role === "zaposleni")
                return SportObject.findById(body.objectId).exec()
            return "SPORTISTA"
        }).then((target: any) => {
            if (target === "DONE") return
            if (body.role === "zaposleni") {
                if (!target)
                    return res.json({ error: "Izabrani objekat ne postoji." })
                if (target.ownerIds.length >= 2)
                    return res.json({ error: "Objekat već ima maksimalan broj zaposlenih." })
            }
            const doc: any = {
                username, email,
                passwordHash: bcrypt.hashSync(body.password, SALT_ROUNDS),
                role: body.role,
                firstName: body.firstName, lastName: body.lastName, phone: body.phone,
                avatarUrl: body.avatar ? saveAvater(body.avatar) : DEFAULT_AVATAR,
                favoriteSports: body.favoriteSports || []
            }
            if (body.role === "zaposleni") {
                doc.objectId = body.objectId
                doc.maticniBroj = body.maticniBroj
                doc.pib = body.pib
            }
            return Registration.create(doc).then(() => res.json({ message: "Zahtev za registraciju je poslat. Sačekajte odobrenje admina." }))
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    login = (req: Request, res: Response) => {
        const body = req.body || {}
        const username = body.username
        const password = body.password
        if (!username || !password)
            return res.json({ error: "Unesite korisničko ime i lozinku." })

        User.findOne({ username }).then(user => {
            if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
                res.json({ error: "Pogrešno korisničko ime ili lozinka." })
                return
            }
            if (user.status !== "approved") {
                res.json({ error: user.status === "pending" ? "Vaš nalog još nije odobren." : "Vaš nalog je odbijen." })
                return
            }
            const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES })
            res.json({ token, user: publicUser(user) })
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    forgotPassword = (req: Request, res: Response) => {
        const id = (req.body?.usernameOrEmail || "").trim()
        User.findOne({ $or: [{ username: id }, { email: id.toLowerCase() }] }).exec().then((user): any => {
            if (!user)
                return res.json({ message: "Korisnik nije pronađen." })
            const token = crypto.randomBytes(32).toString("hex")
            const expiresAt = new Date(Date.now() + RESET_TTL_MIN * 60 * 1000)
            return PasswordReset.create({
                userId: user._id,
                token,
                expiresAt
            }).then(() => {
                const link = `${FRONTEND_URL}/reset-password/${token}`
                console.log("PASSWORD RESET LINK: ", link)
                res.json({ message: "Link za reset je poslat.", devLink: link })
            })
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    resetPassword = (req: Request, res: Response) => {
        const token = req.params.token as string
        const { password } = req.body || {}
        const pass = validatePassword(password)
        if (pass)
            return res.json({ error: pass })

        PasswordReset.findOne({ token }).exec().then(pr => {
            if (!pr || pr.used || pr.expiresAt < new Date())
                return res.json({ error: "Token nije važeći ili je istekao." })
            const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS)
            return User.updateOne({ _id: pr.userId }, { $set: { passwordHash } }).then(() => {
                return PasswordReset.updateOne({ _id: pr._id }, { $set: { used: true } })
            }).then(() => res.json({ message: "Lozinka je uspešno promenjena." }))
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    registrationRequests = (req: Request, res: Response) => {
        Registration.find({ status: "pending" }).populate("objectId", "name city").then(reqs => {
            res.json(reqs)
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    approveRegistration = (req: Request, res: Response) => {
        Registration.findById(req.params.id).then((reqD: any) => {
            if (!reqD || reqD.status !== "pending") {
                res.json({ error: "Zahtev nije pronađen ili je već obrađen." })
                return null
            }
            if (reqD.role === "zaposleni") {
                return SportObject.findById(reqD.objectId).then((obj: any) => {
                    if (!obj) {
                        res.json({ error: "Objekat više ne postoji." })
                        return null
                    }
                    if (obj.ownerIds.length >= 2) {
                        res.json({ error: "Objekat već ima 2 zaposlena." })
                        return null
                    }
                    return Employee.findOne({ maticniBroj: reqD.maticniBroj }).then((existing: any) => {
                        if (existing) {
                            res.json({ error: "Zaposleni sa tim matičnim brojem već postoji." })
                            return null
                        }
                        return { reqD, obj }
                    })
                })
            }
            return { reqD, obj: null }
        }).then((ctx: any) => {
            if (!ctx)
                return
            const { reqD, obj } = ctx
            return User.create({
                username: reqD.username, passwordHash: reqD.passwordHash, role: reqD.role,
                firstName: reqD.firstName, lastName: reqD.lastName, phone: reqD.phone,
                email: reqD.email, avatarUrl: reqD.avatarUrl,
                favoriteSports: reqD.favoriteSports, status: "approved"
            }).then((newUser: any) => {
                reqD.status = "approved"
                const tasks: Promise<any>[] = [reqD.save()]
                if (reqD.role === "zaposleni") {
                    tasks.push(Employee.create({ userId: newUser._id, maticniBroj: reqD.maticniBroj, pib: reqD.pib }))
                    obj.ownerIds.push(newUser._id)
                    tasks.push(obj.save())
                }
                return Promise.all(tasks).then(() => res.json({ message: " registracija uspešno odobrena.", userId: newUser._id }))
            })
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    rejectRegistration = (req: Request, res: Response) => {
        Registration.findByIdAndUpdate(req.params.id, { status: "rejected" }).then(updated => {
            res.json(updated ? { message: "registracija odbijena." } : { error: "Zahtev nije pronađen." })
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }
}