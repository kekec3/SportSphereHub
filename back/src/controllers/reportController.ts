import type { Request, Response } from "express"
import PDFDocument from "pdfkit"
import SportObject from "../models/SportObject.js"
import Terrain from "../models/Terrain.js"
import Reservation from "../models/Reservation.js"
import Equipment from "../models/Equipment.js"
import Order from "../models/Order.js"
import { REPORT_FONT, REPORT_FONT_BOLD } from "../config.js"

interface MonthRange {
    start: Date
    end: Date
    days: number
}

function monthRange(month: string): MonthRange | null {
    if (!month || !/^\d{4}-\d{2}$/.test(month))
        return null
    const parts = month.split("-")
    const year = Number(parts[0])
    const monthNum = Number(parts[1])
    if (!Number.isInteger(year) || !Number.isInteger(monthNum) || monthNum < 1 || monthNum > 12)
        return null
    const start = new Date(year, monthNum - 1, 1)
    const end = new Date(year, monthNum, 1)
    const days = Math.round((end.getTime() - start.getTime()) / 86400000)
    return { start, end, days }
}

function typeLabel(type: string): string {
    if (type === "open")
        return "Otvoren"
    if (type === "closed")
        return "Zatvoren"
    if (type === "hall")
        return "Hala"
    return type
}

function today(): string {
    const now = new Date()
    const day = String(now.getDate()).padStart(2, "0")
    const month = String(now.getMonth() + 1).padStart(2, "0")
    return `${day}.${month}.${now.getFullYear()}.`
}

function startPdf(res: Response, filename: string): any {
    const doc = new PDFDocument({ margin: 40, size: "A4" })
    doc.registerFont("reg", REPORT_FONT)
    doc.registerFont("bold", REPORT_FONT_BOLD)
    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`)
    doc.pipe(res)
    return doc
}

function drawTable(doc: any, cols: any[], rows: any[]): void {
    let y = doc.y
    doc.font("bold").fontSize(10).fillColor("#000000")
    for (const col of cols)
        doc.text(col.title, col.x, y, { width: col.width, align: col.align || "left" })
    y += 16
    doc.moveTo(40, y).lineTo(555, y).strokeColor("#cccccc").stroke()
    y += 6

    doc.font("reg").fontSize(10).fillColor("#222222")
    for (const row of rows) {
        for (const col of cols)
            doc.text(String(row[col.key]), col.x, y, { width: col.width, align: col.align || "left" })
        y += 18
        if (y > 780) {
            doc.addPage()
            y = 40
        }
    }
    doc.y = y
}

export class ReportController {

    occupancy = (req: Request, res: Response) => {
        const userId = req.user?.userId || ""
        const objectId = req.query.object as string
        const month = req.query.month as string
        const range = monthRange(month)
        if (!range)
            return res.status(400).json({ error: "Neispravan mesec." })

        SportObject.findOne({ _id: objectId, ownerIds: userId }).then((obj: any): any => {
            if (!obj)
                return res.status(404).json({ error: "Objekat nije pronađen." })
            return Terrain.find({ objectId }).sort({ name: 1 }).then((terrains: any[]) => {
                const terrainIds = terrains.map(t => t._id)
                return Reservation.find({
                    resourceId: { $in: terrainIds },
                    date: { $gte: range.start, $lt: range.end },
                    status: { $ne: "cancelled" }
                }).then((reservations: any[]) => {
                    const bookedById: any = {}
                    for (const reservation of reservations) {
                        const hours = (parseInt(reservation.endTime) - parseInt(reservation.startTime)) || 0
                        bookedById[String(reservation.resourceId)] = (bookedById[String(reservation.resourceId)] || 0) + hours
                    }
                    const openH = parseInt(obj.workingHours?.open || "8")
                    const closeH = parseInt(obj.workingHours?.close || "22")
                    const hoursPerDay = Math.max(0, closeH - openH)
                    const available = hoursPerDay * range.days

                    let totalBooked = 0
                    const rows = terrains.map(terrain => {
                        const booked = bookedById[String(terrain._id)] || 0
                        totalBooked += booked
                        const pct = available > 0 ? (booked / available) * 100 : 0
                        return {
                            name: terrain.name,
                            type: typeLabel(terrain.type),
                            booked: `${booked} h`,
                            available: `${available} h`,
                            pct: `${pct.toFixed(1)} %`
                        }
                    })

                    const doc = startPdf(res, `popunjenost-${month}.pdf`)
                    doc.font("bold").fontSize(18).fillColor("#000000").text("Izveštaj o popunjenosti terena")
                    doc.moveDown(0.4)
                    doc.font("reg").fontSize(11).fillColor("#555555")
                    doc.text(`Objekat: ${obj.name}, ${obj.city}`)
                    doc.text(`Mesec: ${month}   (radno vreme ${obj.workingHours?.open}-${obj.workingHours?.close}, ${range.days} dana)`)
                    doc.text(`Generisano: ${today()}`)
                    doc.moveDown(1)

                    drawTable(doc, [
                        { key: "name", title: "Teren", x: 40, width: 150, align: "left" },
                        { key: "type", title: "Tip", x: 190, width: 90, align: "left" },
                        { key: "booked", title: "Rezervisano", x: 300, width: 80, align: "right" },
                        { key: "available", title: "Dostupno", x: 390, width: 80, align: "right" },
                        { key: "pct", title: "Popunjenost", x: 475, width: 80, align: "right" }
                    ], rows)

                    doc.moveDown(1)
                    const avg = available > 0 && terrains.length > 0 ? (totalBooked / (available * terrains.length)) * 100 : 0
                    doc.font("bold").fontSize(11).fillColor("#000000")
                    doc.text(`Ukupno rezervisano: ${totalBooked} h     Prosečna popunjenost: ${avg.toFixed(1)} %`, 40)

                    doc.end()
                })
            })
        }).catch(err => {
            console.log(err)
            if (!res.headersSent)
                res.status(500).json(null)
        })
    }

    turnover = (req: Request, res: Response) => {
        const userId = req.user?.userId || ""
        const objectId = req.query.object as string
        const month = req.query.month as string
        const range = monthRange(month)
        if (!range)
            return res.status(400).json({ error: "Neispravan mesec." })

        SportObject.findOne({ _id: objectId, ownerIds: userId }).then((obj: any): any => {
            if (!obj)
                return res.status(404).json({ error: "Objekat nije pronađen." })
            return Equipment.find({ objectId }).populate("sport", "name").sort({ name: 1 }).then((equipment: any[]) => {
                const eqIds = equipment.map(e => e._id)
                const eqIdSet = new Set(eqIds.map(id => String(id)))
                return Order.find({
                    createdAt: { $gte: range.start, $lt: range.end },
                    status: { $ne: "cancelled" },
                    "items.equipmentId": { $in: eqIds }
                }).then((orders: any[]) => {
                    const soldById: any = {}
                    for (const order of orders) {
                        for (const item of order.items) {
                            const key = String(item.equipmentId)
                            if (!eqIdSet.has(key))
                                continue
                            if (!soldById[key])
                                soldById[key] = { qty: 0, revenue: 0 }
                            soldById[key].qty += item.quantity
                            soldById[key].revenue += item.priceAtOrder * item.quantity
                        }
                    }

                    let totalRevenue = 0
                    let totalQty = 0
                    const rows = equipment.map(item => {
                        const sold = soldById[String(item._id)] || { qty: 0, revenue: 0 }
                        totalRevenue += sold.revenue
                        totalQty += sold.qty
                        return {
                            name: item.name,
                            sport: item.sport?.name || "",
                            qty: String(sold.qty),
                            revenue: `${sold.revenue} RSD`
                        }
                    })

                    const doc = startPdf(res, `obrt-opreme-${month}.pdf`)
                    doc.font("bold").fontSize(18).fillColor("#000000").text("Izveštaj o obrtu opreme")
                    doc.moveDown(0.4)
                    doc.font("reg").fontSize(11).fillColor("#555555")
                    doc.text(`Objekat: ${obj.name}, ${obj.city}`)
                    doc.text(`Mesec: ${month}`)
                    doc.text(`Generisano: ${today()}`)
                    doc.moveDown(1)

                    drawTable(doc, [
                        { key: "name", title: "Oprema", x: 40, width: 190, align: "left" },
                        { key: "sport", title: "Sport", x: 230, width: 120, align: "left" },
                        { key: "qty", title: "Prodato (kom)", x: 355, width: 95, align: "right" },
                        { key: "revenue", title: "Prihod", x: 455, width: 100, align: "right" }
                    ], rows)

                    doc.moveDown(1)
                    doc.font("bold").fontSize(11).fillColor("#000000")
                    doc.text(`Ukupno prodato: ${totalQty} kom     Ukupan prihod: ${totalRevenue} RSD`, 40)

                    doc.end()
                })
            })
        }).catch(err => {
            console.log(err)
            if (!res.headersSent)
                res.status(500).json(null)
        })
    }
}
