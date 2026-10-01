import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken"
import { JWT_SECRET } from "../config.js";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization || ""
    const token = header.startsWith("Bearer ") ? header.slice(7) : null
    if (!token)
        return res.status(401).json({ error: "Niste prijavljeni." })
    try {
        req.user = jwt.verify(token, JWT_SECRET) as { userId: string, role: string }
        next()
    } catch {
        res.status(401).json({ error: "Nevažeći token." })
    }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization || ""
    const token = header.startsWith("Bearer ") ? header.slice(7) : null
    if (token) {
        try {
            req.user = jwt.verify(token, JWT_SECRET) as { userId: string, role: string }
        } catch {

        }
    }
    next()
}
