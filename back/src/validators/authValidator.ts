const PASSWORD_RE = /^(?=.{8,12}$)(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[A-Za-z].*$/
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export function validatePassword(password: string): string | null {
    if (!PASSWORD_RE.test(password || ""))
        return "Lozinka mora imati 8-12 karaktera, počinjati slovom i sadržati bar jedno veliko slovo, cifru i specijalni karakter."
    return null
}

export function validateRegister(b: any): string | null {
    if (!b || !b.username || !b.email || !b.password || !b.role || !b.firstName || !b.lastName || !b.phone)
        return "Sva obavezna polja moraju biti popunjena."
    if (b.role !== "sportista" && b.role !== "zaposleni")
        return "Nevažeća uloga."
    if (!EMAIL_RE.test(b.email))
        return "Email nije u ispravnom formatu."
    const pass = validatePassword(b.password)
    if (pass) return pass
    if (b.favoriteSports && (!Array.isArray(b.favoriteSports) || b.favoriteSports.length > 5))
        return "Možete izabrati najviše 5 omiljenih sportova."
    if (b.role === "zaposleni") {
        if (!b.objectId) return "Izaberite objekat u kojem radite."
        if (!/^\d{8}$/.test(b.maticniBroj || "")) return "Matični broj mora imati tačno 8 cifara."
        if (!/^[1-9]\d{8}$/.test(b.pib || "")) return "PIB mora imati 9 cifara i ne sme počinjati nulom."
    }
    return null
}

export function validateProfileUpdate(b: any): string | null {
    if (!b || !b.firstName || !b.lastName || !b.phone || !b.email)
        return "Sva obavezna polja moraju biti popunjena."
    if (!EMAIL_RE.test(b.email))
        return "Email nije u ispravnom formatu"
    if (b.favoriteSports && (!Array.isArray(b.favoriteSports) || b.favoriteSports.length > 5))
        return "Možete izabrati najviše 5 omiljenih sportova."
    return null
}
