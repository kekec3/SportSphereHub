

export function startDateTime(res: any): Date {
    const d = new Date(res.date)
    const parts = String(res.startTime).split(":")
    const h = Number(parts[0]) || 0
    const m = Number(parts[1]) || 0
    d.setHours(h, m, 0, 0)
    return d
}

export function isCancellable(res: any): boolean {
    if (res.status === "pending")
        return true
    if (res.status === "confirmed") {
        const hours = (startDateTime(res).getTime() - Date.now()) / 3600000
        return hours >= 12
    }
    return false
}

export function isInConfirmWindow(res: any): boolean {
    const start = startDateTime(res).getTime()
    const now = Date.now()
    return now >= start && now <= start + 10 * 60 * 1000
}
