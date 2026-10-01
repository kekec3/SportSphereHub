import type { Request, Response } from "express";
import SportObject from "../models/SportObject.js";
import Terrain from "../models/Terrain.js";
import Equipment from "../models/Equipment.js";
import Promotion from "../models/Promotion.js";
import { filterFreeToday } from "../utils/availability.js";
import { validateObjectPayload, validateObjectMeta, validateResource } from "../validators/objectValidator.js"
import Coach from "../models/Coach.js"

export class ObjectController {

    listApproved = (req: Request, res: Response) => {
        SportObject.find({ status: "approved" }).select("name city").sort({ name: 1 }).then(objs => {
            res.json(objs)
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    stats = (req: Request, res: Response) => {
        Promise.all([
            SportObject.countDocuments({ status: "approved" }),
            SportObject.aggregate([
                { $match: { status: "approved" } },
                { $addFields: { likeCount: { $size: "$likes" }, dislikeCount: { $size: "$dislikes" } } },
                { $sort: { likeCount: -1, name: 1 } },
                { $limit: 3 },
                { $project: { name: 1, city: 1, pricePerHour: 1, likeCount: 1, dislikeCount: 1, photos: 1 } }
            ])
        ]).then(([activeCount, topObjects]) => {
            res.json({ activeCount, topObjects })
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    listCities = (req: Request, res: Response) => {
        SportObject.distinct("city", { status: "approved" }).then(cities => {
            res.json(cities.sort())
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    searchObjects = (req: Request, res: Response) => {
        const name = req.query.name as string
        const city = req.query.city as string
        const sport = req.query.sport as string
        const terrainType = req.query.terrainType as string
        const onlyFreeToday = req.query.onlyFreeToday === "true"

        const filter: any = { status: "approved" }
        if (name) filter.name = { $regex: name, $options: "i" }
        if (city) filter.city = { $in: city.split(",").filter(Boolean) }

        const terrainFilter: any = {}
        if (sport) terrainFilter.sports = sport
        if (terrainType) terrainFilter.type = terrainType

        const restrict: Promise<any> = (sport || terrainType) ? Terrain.distinct("objectId", terrainFilter).exec() : Promise.resolve(null)

        restrict.then((ids: any) => {
            if (ids != null)
                filter._id = { $in: ids }
            return SportObject.aggregate([
                { $match: filter },
                { $addFields: { likeCount: { $size: "$likes" }, dislikeCount: { $size: "$dislikes" } } },
                { $sort: { name: 1 } },
                { $project: { name: 1, city: 1, address: 1, pricePerHour: 1, workingHours: 1, likeCount: 1, dislikeCount: 1 } }
            ])
        }).then((objs: any[]) => {
            const objIds = objs.map(o => o._id)
            return Terrain.find({ objectId: { $in: objIds } }).populate("sports", "name").then((terrains: any[]) => {
                const sportsByObject: Record<string, Set<string>> = {}
                for (const terrain of terrains) {
                    const key = String(terrain.objectId)
                    if (sportsByObject[key] == null)
                        sportsByObject[key] = new Set<string>()
                    for (const sport of terrain.sports)
                        sportsByObject[key].add(sport.name)
                }
                for (const obj of objs)
                    obj.sportNames = Array.from(sportsByObject[String(obj._id)] ?? []).sort().join(", ")

                if (!onlyFreeToday)
                    return res.json(objs)
                return filterFreeToday(objs).then(free => res.json(free))
            })
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    getById = (req: Request, res: Response) => {
        const id = req.params.id as string
        const now = new Date()

        SportObject.findOne({ _id: id, status: "approved" }).then((obj: any) => {
            if (obj == null) {
                res.json(null)
                return
            }
            Promise.all([
                Terrain.find({ objectId: id }).populate("sports", "name").sort({ name: 1 }),
                Equipment.find({ objectId: id }).populate("sport", "name").sort({ name: 1 }),
                Promotion.find({ objectId: id, validFrom: { $lte: now }, validTo: { $gte: now } }).populate("sport", "name")
            ]).then(([terrains, equipment, promotions]) => {
                res.json({
                    object: {
                        _id: obj._id,
                        name: obj.name,
                        city: obj.city,
                        address: obj.address,
                        location: obj.location,
                        pricePerHour: obj.pricePerHour,
                        workingHours: obj.workingHours,
                        photos: obj.photos,
                        likeCount: obj.likes.length,
                        dislikeCount: obj.dislikes.length
                    },
                    terrains,
                    equipment,
                    promotions
                })
            })
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    createObject = (req: Request, res: Response) => {
        this.saveNewObject(req.body || {}, req.user?.userId || "", res)
    }

    importObject = (req: Request, res: Response) => {
        const payload = req.body?.data ?? req.body
        this.saveNewObject(payload || {}, req.user?.userId || "", res)
    }

    saveNewObject = (body: any, userId: string, res: Response) => {
        const err = validateObjectPayload(body)
        if (err)
            return res.json({ error: err })

        SportObject.create({
            name: String(body.name).trim(),
            city: String(body.city).trim(),
            address: String(body.address).trim(),
            location: { lat: Number(body.location.lat), lng: Number(body.location.lng) },
            ownerIds: [userId],
            pricePerHour: Number(body.pricePerHour),
            workingHours: { open: body.workingHours.open, close: body.workingHours.close },
            maxNoShows: Number(body.maxNoShows),
            photos: Array.isArray(body.photos) ? body.photos : [],
            status: "pending"
        }).then((obj: any) => {
            const terrains = body.resources.map((r: any) => ({
                objectId: obj._id,
                name: String(r.name).trim(),
                type: r.type,
                capacity: Number(r.capacity),
                sports: r.sports,
                equipmentDescription: r.equipmentDescription ? String(r.equipmentDescription).trim() : ""
            }))
            return Terrain.insertMany(terrains).then(() =>
                res.json({ message: "Objekat je kreiran i čeka odobrenje administratora.", objectId: obj._id })
            ).catch((e: any) => {
                return SportObject.deleteOne({ _id: obj._id }).then(() => {
                    console.log(e)
                    res.json({ error: "Greška pri kreiranju terena. Proverite podatke o sportovima." })
                })
            })
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    myObjects = (req: Request, res: Response) => {
        const userId = req.user?.userId || ""
        SportObject.find({ ownerIds: userId }).sort({ createdAt: -1 }).then((objs: any[]) => {
            const ids = objs.map(o => o._id)
            return Terrain.find({ objectId: { $in: ids } }).populate("sports", "name").sort({ name: 1 }).then((terrains: any[]) => {
                const byId: Record<string, { sports: Set<string>, elements: any[] }> = {}
                for (const terrain of terrains) {
                    const key = String(terrain.objectId)
                    if (byId[key] == null)
                        byId[key] = { sports: new Set<string>(), elements: [] }
                    for (const sport of terrain.sports)
                        byId[key].sports.add(sport.name)
                    byId[key].elements.push({ name: terrain.name, type: terrain.type, capacity: terrain.capacity })
                }
                res.json(objs.map(o => {
                    const info = byId[String(o._id)]
                    return {
                        _id: o._id, name: o.name, city: o.city, address: o.address,
                        status: o.status, pricePerHour: o.pricePerHour,
                        terrainCount: info ? info.elements.length : 0,
                        sports: info ? Array.from(info.sports).sort() : [],
                        elements: info ? info.elements : []
                    }
                }))
            })
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }


    getOwned = (req: Request, res: Response) => {
        const userId = req.user?.userId || ""
        const id = req.params.id as string
        SportObject.findOne({ _id: id, ownerIds: userId }).then((obj: any): any => {
            if (!obj)
                return res.json(null)
            return Terrain.find({ objectId: id }).populate("sports", "name").sort({ name: 1 }).then(terrains => {
                res.json({ object: obj, terrains })
            })
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    updateObject = (req: Request, res: Response) => {
        const userId = req.user?.userId || ""
        const id = req.params.id as string
        const body = req.body || {}
        const err = validateObjectMeta(body)
        if (err)
            return res.json({ error: err })
        SportObject.findOne({ _id: id, ownerIds: userId }).then((obj: any): any => {
            if (!obj)
                return res.json({ error: "Objekat nije pronađen." })
            obj.name = String(body.name).trim()
            obj.city = String(body.city).trim()
            obj.address = String(body.address).trim()
            obj.location = { lat: Number(body.location.lat), lng: Number(body.location.lng) }
            obj.pricePerHour = Number(body.pricePerHour)
            obj.workingHours = { open: body.workingHours.open, close: body.workingHours.close }
            obj.maxNoShows = Number(body.maxNoShows)
            if (Array.isArray(body.photos))
                obj.photos = body.photos
            return obj.save().then(() => res.json({ message: "Objekat je izmenjen." }))
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    addResource = (req: Request, res: Response) => {
        const userId = req.user?.userId || ""
        const id = req.params.id as string
        const r = req.body || {}
        const err = validateResource(r)
        if (err)
            return res.json({ error: err })
        SportObject.findOne({ _id: id, ownerIds: userId }).then((obj: any): any => {
            if (!obj)
                return res.json({ error: "Objekat nije pronađen." })
            return Terrain.create({
                objectId: id,
                name: String(r.name).trim(),
                type: r.type,
                capacity: Number(r.capacity),
                sports: r.sports,
                equipmentDescription: r.equipmentDescription ? String(r.equipmentDescription).trim() : ""
            }).then(t => {
                res.json({ message: "Teren je dodat.", terrain: t })
            })
        }).catch((err: any) => {
            if (err?.code === 11000)
                return res.json({ error: "Teren sa tim nazivom već postoji u objektu." })
            console.log(err)
            res.json(null)
        })
    }

    updateResource = (req: Request, res: Response) => {
        const userId = req.user?.userId || ""
        const id = req.params.id as string
        const rid = req.params.rid as string
        const r = req.body || {}
        const err = validateResource(r)
        if (err)
            return res.json({ error: err })
        SportObject.findOne({ _id: id, ownerIds: userId }).then((obj: any): any => {
            if (!obj)
                return res.json({ error: "Objekat nije pronađen." })
            return Terrain.findOne({ _id: rid, objectId: id }).then((t: any): any => {
                if (!t)
                    return res.json({ error: "Teren nije pronađen." })
                const losesOpen4 = t.type === "open" && t.capacity >= 4 && !(r.type === "open" && Number(r.capacity) >= 4)
                const guard: Promise<number> = losesOpen4
                    ? Terrain.countDocuments({ objectId: id, type: "open", capacity: { $gte: 4 }, _id: { $ne: rid } }).exec()
                    : Promise.resolve(1)
                return guard.then((otherCount: number): any => {
                    if (losesOpen4 && otherCount === 0)
                        return res.json({ error: "Objekat mora imati bar jedan otvoren teren kapaciteta najmanje 4." })
                    t.name = String(r.name).trim()
                    t.type = r.type
                    t.capacity = Number(r.capacity)
                    t.sports = r.sports
                    t.equipmentDescription = r.equipmentDescription ? String(r.equipmentDescription).trim() : ""
                    return t.save().then(() => res.json({ message: "Teren je izmenjen." }))
                })
            })
        }).catch((err: any) => {
            if (err?.code === 11000)
                return res.json({ error: "Teren sa tim nazivom već postoji u objektu." })
            console.log(err)
            res.json(null)
        })
    }

    deleteResource = (req: Request, res: Response) => {
        const userId = req.user?.userId || ""
        const id = req.params.id as string
        const rid = req.params.rid as string
        SportObject.findOne({ _id: id, ownerIds: userId }).then((obj: any): any => {
            if (!obj)
                return res.json({ error: "Objekat nije pronađen." })
            return Terrain.findOne({ _id: rid, objectId: id }).then((t: any): any => {
                if (!t)
                    return res.json({ error: "Teren nije pronađen." })
                return Terrain.countDocuments({ objectId: id }).exec().then((total: number): any => {
                    if (total <= 1)
                        return res.json({ error: "Objekat mora imati bar jedan teren." })
                    const isOpen4 = t.type === "open" && t.capacity >= 4
                    const openGuard: Promise<number> = isOpen4
                        ? Terrain.countDocuments({ objectId: id, type: "open", capacity: { $gte: 4 }, _id: { $ne: rid } }).exec()
                        : Promise.resolve(1)
                    return openGuard.then((otherOpen4: number): any => {
                        if (isOpen4 && otherOpen4 === 0)
                            return res.json({ error: "Objekat mora imati bar jedan otvoren teren kapaciteta najmanje 4." })
                        return Terrain.deleteOne({ _id: rid }).then(() => res.json({ message: "Teren je obrisan." }))
                    })
                })
            })
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    listPending = (req: Request, res: Response) => {
        SportObject.find({ status: "pending" }).populate("ownerIds", "firstName lastName username").sort({ createdAt: -1 }).then((objs: any[]) => {
            const ids = objs.map(o => o._id)
            return Terrain.aggregate([
                { $match: { objectId: { $in: ids } } },
                { $group: { _id: "$objectId", count: { $sum: 1 } } }
            ]).then((counts: any[]) => {
                const byId: any = {}
                counts.forEach(c => { byId[String(c._id)] = c.count })
                res.json(objs.map(o => ({
                    _id: o._id,
                    name: o.name,
                    city: o.city,
                    address: o.address,
                    pricePerHour: o.pricePerHour,
                    owners: (o.ownerIds || []).map((u: any) => (u.firstName || u.lastName) ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : u.username),
                    terrainCount: byId[String(o._id)] || 0
                })))
            })
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    approveObject = (req: Request, res: Response) => {
        const id = req.params.id as string
        SportObject.findByIdAndUpdate(id, { $set: { status: "approved" } }, { new: true }).then((obj: any) => {
            if (!obj)
                return res.json({ error: "Objekat nije pronađen." })
            res.json({ message: "Objekat je odobren." })
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }

    rejectObject = (req: Request, res: Response) => {
        const id = req.params.id as string
        SportObject.findById(id).then((obj: any): any => {
            if (!obj)
                return res.json({ error: "Objekat nije pronađen." })
            return Promise.all([
                SportObject.deleteOne({ _id: id }),
                Terrain.deleteMany({ objectId: id }),
                Equipment.deleteMany({ objectId: id }),
                Promotion.deleteMany({ objectId: id }),
                Coach.deleteMany({ objectId: id })
            ]).then(() => res.json({ message: "Objekat je odbijen i obrisan." }))
        }).catch(err => {
            console.log(err)
            res.json(null)
        })
    }
}