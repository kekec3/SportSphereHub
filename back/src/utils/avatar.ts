import fs from "fs"
import path from "path"

const AVATAR_DIR = path.join(process.cwd(), "uploads", "avatars")

export function saveAvater(input: string): string {
    const match = /^data:image\/(png|jpeg|jpg);base64,(.+)$/.exec(input || "")
    let ext = "png"
    let data = input
    if (match) {
        ext = match[1] === "jpeg" ? "jpg" : match[1]!
        data = match[2]!
    }
    const buffer = Buffer.from(data, "base64")
    if (!fs.existsSync(AVATAR_DIR))
        fs.mkdirSync(AVATAR_DIR, { recursive: true })
    const filename = `avatar_${Date.now()}_${Math.round(Math.random() * 1e9)}.${ext}`
    fs.writeFileSync(path.join(AVATAR_DIR, filename), buffer)
    return `/uploads/avatars/${filename}`
}