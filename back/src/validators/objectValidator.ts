const TIME_REG = /^([01]\d|2[0-3]):([0-5]\d)$/
const TYPES = ["open", "closed", "hall"]

export function validateResource(r: any): string | null {
    if (!r || typeof r !== "object")
        return "Neispravan teren."
    if (!r.name || typeof r.name !== "string" || !r.name.trim())
        return "Teren mora imati naziv."
    if (!TYPES.includes(r.type))
        return "Neispravan tip terena."
    const cap = Number(r.capacity)
    if (!Number.isInteger(cap) || cap < 1)
        return "Kapacitet terena mora biti ceo broj veći od 0."
    if (!Array.isArray(r.sports) || r.sports.length === 0)
        return "Teren mora podržavati bar jedan sport."
    if (r.equipmentDescription && String(r.equipmentDescription).length > 300)
        return "Opis opreme može imati najviše 300 karaktera."
    return null
}

export function validateObjectMeta(body: any): string | null {
    if (!body || typeof body !== "object")
        return "Neispravni podaci."
    if (!body.name || !String(body.name).trim())
        return "Naziv objekta je obavezan."
    if (!body.city || !String(body.city).trim())
        return "Grad je obavezan."
    if (!body.address || !String(body.address).trim())
        return "Adresa je obavezna."
    const lat = Number(body.location?.lat)
    const lng = Number(body.location?.lng)
    if (!Number.isFinite(lat) || lat < -90 || lat > 90)
        return "Neispravna geografska širina (lat)."
    if (!Number.isFinite(lng) || lng < -180 || lng > 180)
        return "Neispravna geografska dužina (lng)."
    const price = Number(body.pricePerHour)
    if (!Number.isFinite(price) || price < 0)
        return "Cena po satu mora biti broj ≥ 0."
    if (!TIME_REG.test(body.workingHours?.open || "") || !TIME_REG.test(body.workingHours?.close || ""))
        return "Radno vreme mora biti u formatu HH:MM."
    if (body.workingHours.open >= body.workingHours.close)
        return "Vreme otvaranja mora biti pre vremena zatvaranja."
    const maxNoShows = Number(body.maxNoShows)
    if (!Number.isInteger(maxNoShows) || maxNoShows < 1)
        return "Maksimalan broj nedolazaka mora biti ceo broj ≥ 1."
    return null
}

export function validateObjectPayload(body: any): string | null {
    const metaErr = validateObjectMeta(body)
    if (metaErr)
        return metaErr

    const resources = body.resources
    if (!Array.isArray(resources) || resources.length === 0)
        return "Objekat mora imati bar jedan teren."
    for (const r of resources) {
        const err = validateResource(r)
        if (err)
            return err
    }
    const names = resources.map((r: any) => String(r.name).trim().toLowerCase())
    if (new Set(names).size !== names.length)
        return "Nazivi terena moraju biti jedinstveni unutar objekta."
    const hasOpen4 = resources.some((r: any) => r.type === "open" && Number(r.capacity) >= 4)
    if (!hasOpen4)
        return "Objekat mora imati bar jedan otvoren teren kapaciteta najmanje 4."
    return null
}
