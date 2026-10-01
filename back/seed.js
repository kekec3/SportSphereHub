// Standalone DB seed — run manually, independent of the app:
//     npx tsx seed.ts     (from the back/ folder)
// Spec requires the DB be populated independently of app boot (-5 if empty at
// defense). Re-run before the defense; it clears every collection first so it is
// safe to run repeatedly. Some reservations are seeded RELATIVE TO NOW so the
// time-gated rules (12h cancel cutoff, 10-min confirm/no-show window) are
// demoable straight after seeding.
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Sport from "./src/models/Sport.js";
import User from "./src/models/User.js";
import Employee from "./src/models/Employee.js";
import SportObject from "./src/models/SportObject.js";
import Terrain from "./src/models/Terrain.js";
import Coach from "./src/models/Coach.js";
import Equipment from "./src/models/Equipment.js";
import Promotion from "./src/models/Promotion.js";
import Reservation from "./src/models/Reservation.js";
import Rating from "./src/models/Rating.js";
import Training from "./src/models/Training.js";
import Order from "./src/models/Order.js";
import Teammate from "./src/models/Teammate.js";
import JoinRequest from "./src/models/JoinRequest.js";
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/sportsphere_hub";
// --- date/time helpers (whole app stores HH:MM strings + a separate date) -----
const now = new Date();
const pad = (n) => String(n).padStart(2, "0");
const hhmm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const addHours = (d, h) => new Date(d.getTime() + h * 3600 * 1000);
const dayAt = (offsetDays) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offsetDays);
    d.setHours(0, 0, 0, 0);
    return d;
};
const hash = (pw) => bcrypt.hashSync(pw, 10);
async function main() {
    await mongoose.connect(MONGO_URI);
    console.log("connected:", MONGO_URI);
    // wipe everything so the seed is idempotent -------------------------------
    await Promise.all([
        Sport.deleteMany({}), User.deleteMany({}), Employee.deleteMany({}),
        SportObject.deleteMany({}), Terrain.deleteMany({}), Coach.deleteMany({}),
        Equipment.deleteMany({}), Promotion.deleteMany({}), Reservation.deleteMany({}),
        Rating.deleteMany({}), Training.deleteMany({}), Order.deleteMany({}),
        Teammate.deleteMany({}), JoinRequest.deleteMany({})
    ]);
    console.log("cleared all collections");
    // sports ------------------------------------------------------------------
    const sports = await Sport.insertMany(["Fudbal", "Košarka", "Tenis", "Odbojka", "Rukomet"].map(name => ({ name })));
    const S = {};
    for (const s of sports)
        S[s.name] = s._id;
    // admin (never created via a signup route) --------------------------------
    await User.create({
        username: "admin", passwordHash: hash("Admin123!"), role: "admin",
        firstName: "Admin", lastName: "Sistem", phone: "0600000000",
        email: "admin@sportsphere.rs", status: "approved"
    });
    // sportisti ---------------------------------------------------------------
    const [pera, marko, jovana, nikola] = await User.create([
        {
            username: "pera", passwordHash: hash("Sport123!"), role: "sportista",
            firstName: "Petar", lastName: "Perić", phone: "0611111111",
            email: "pera@example.com", status: "approved",
            favoriteSports: [S["Fudbal"], S["Košarka"]]
        },
        {
            username: "marko", passwordHash: hash("Sport123!"), role: "sportista",
            firstName: "Marko", lastName: "Marković", phone: "0622222222",
            email: "marko@example.com", status: "approved",
            favoriteSports: [S["Tenis"]]
        },
        {
            username: "jovana", passwordHash: hash("Sport123!"), role: "sportista",
            firstName: "Jovana", lastName: "Jovanović", phone: "0633333333",
            email: "jovana@example.com", status: "approved",
            favoriteSports: [S["Odbojka"], S["Rukomet"], S["Košarka"]]
        },
        {
            username: "nikola", passwordHash: hash("Sport123!"), role: "sportista",
            firstName: "Nikola", lastName: "Nikolić", phone: "0644444444",
            email: "nikola@example.com", status: "approved",
            favoriteSports: [S["Fudbal"]]
        }
    ]);
    // employees (users + business-detail records) -----------------------------
    const [zoran, ana, stefan] = await User.create([
        {
            username: "zoran", passwordHash: hash("Radnik12!"), role: "zaposleni",
            firstName: "Zoran", lastName: "Zorić", phone: "0655555555",
            email: "zoran@example.com", status: "approved"
        },
        {
            username: "ana", passwordHash: hash("Radnik12!"), role: "zaposleni",
            firstName: "Ana", lastName: "Anić", phone: "0666666666",
            email: "ana@example.com", status: "approved"
        },
        {
            username: "stefan", passwordHash: hash("Radnik12!"), role: "zaposleni",
            firstName: "Stefan", lastName: "Stefanović", phone: "0677777777",
            email: "stefan@example.com", status: "approved"
        }
    ]);
    await Employee.create([
        { userId: zoran._id, maticniBroj: "20345678", pib: "101234567" },
        { userId: ana._id, maticniBroj: "20345679", pib: "101234568" },
        { userId: stefan._id, maticniBroj: "20345680", pib: "101234569" }
    ]);
    // objects (all approved so they are publicly searchable) ------------------
    // obj1 intentionally has TWO owners to exercise the max-2-employees rule.
    const obj1 = await SportObject.create({
        name: "Sportski centar Voždovac", city: "Beograd", address: "Kumodraška 20",
        location: { lat: 44.7866, lng: 20.4772 }, ownerIds: [zoran._id, ana._id],
        pricePerHour: 2000, workingHours: { open: "08:00", close: "23:00" }, maxNoShows: 3,
        likes: [pera._id, jovana._id], dislikes: [marko._id],
        photos: [], status: "approved"
    });
    const obj2 = await SportObject.create({
        name: "Hala Pinki", city: "Beograd", address: "Gradski park 2",
        location: { lat: 44.8451, lng: 20.4010 }, ownerIds: [ana._id],
        pricePerHour: 2500, workingHours: { open: "09:00", close: "22:00" }, maxNoShows: 2,
        likes: [marko._id], dislikes: [], photos: [], status: "approved"
    });
    const obj3 = await SportObject.create({
        name: "Tenis klub As", city: "Novi Sad", address: "Sremska 14",
        location: { lat: 45.2671, lng: 19.8335 }, ownerIds: [stefan._id],
        pricePerHour: 1800, workingHours: { open: "07:00", close: "21:00" }, maxNoShows: 3,
        likes: [jovana._id], dislikes: [], photos: [], status: "approved"
    });
    const obj4 = await SportObject.create({
        name: "SPENS", city: "Novi Sad", address: "Sutjeska 2",
        location: { lat: 45.2517, lng: 19.8369 }, ownerIds: [stefan._id],
        pricePerHour: 3000, workingHours: { open: "08:00", close: "23:00" }, maxNoShows: 4,
        likes: [], dislikes: [], photos: [], status: "approved"
    });
    // resources (each object has >=1 OPEN terrain with capacity >=4; closed/hall
    // exist so the drag-and-drop-only-on-closed-halls rule is demoable) --------
    const [t1open, t1closed, t1hall] = await Terrain.create([
        { objectId: obj1._id, name: "Teren 1", type: "open", capacity: 10, sports: [S["Fudbal"]], equipmentDescription: "Golovi, mreže, lopte." },
        { objectId: obj1._id, name: "Mala sala", type: "closed", capacity: 6, sports: [S["Košarka"]], equipmentDescription: "Parket, koševi." },
        { objectId: obj1._id, name: "Velika dvorana", type: "hall", capacity: 24, sports: [S["Košarka"], S["Odbojka"], S["Rukomet"]], equipmentDescription: "Tribine, semafor, klima." }
    ]);
    const [t2open, t2closed] = await Terrain.create([
        { objectId: obj2._id, name: "Teren A", type: "open", capacity: 8, sports: [S["Fudbal"]], equipmentDescription: "Veštačka trava." },
        { objectId: obj2._id, name: "Sala 1", type: "closed", capacity: 5, sports: [S["Odbojka"]], equipmentDescription: "Odbojkaška mreža." }
    ]);
    const [t3clay1, t3clay2] = await Terrain.create([
        { objectId: obj3._id, name: "Šljaka 1", type: "open", capacity: 4, sports: [S["Tenis"]], equipmentDescription: "Reketi na iznajmljivanje." },
        { objectId: obj3._id, name: "Šljaka 2", type: "open", capacity: 4, sports: [S["Tenis"]], equipmentDescription: "" }
    ]);
    const [t4open, t4hall] = await Terrain.create([
        { objectId: obj4._id, name: "Teren 1", type: "open", capacity: 12, sports: [S["Rukomet"], S["Fudbal"]], equipmentDescription: "Rukometni golovi." },
        { objectId: obj4._id, name: "Dvorana", type: "hall", capacity: 30, sports: [S["Košarka"], S["Odbojka"], S["Rukomet"]], equipmentDescription: "Velika dvorana." }
    ]);
    // coaches -----------------------------------------------------------------
    const [coachFudbal, coachTenis] = await Coach.create([
        { name: "Dragan Trener", objectId: obj1._id, sport: S["Fudbal"], specialization: "Napad", pricePerHour: 1500, avgRating: 4.5, active: true },
        { name: "Milan Reket", objectId: obj3._id, sport: S["Tenis"], specialization: "Servis", pricePerHour: 1800, avgRating: 4.2, active: true }
    ]);
    await Coach.create({ name: "Ivana Kos", objectId: obj1._id, sport: S["Košarka"], specialization: "Šut", pricePerHour: 1600, avgRating: 4.8, active: true });
    // equipment ---------------------------------------------------------------
    const [ballFudbal, racket] = await Equipment.create([
        { objectId: obj1._id, sport: S["Fudbal"], name: "Fudbalska lopta", price: 3500, stock: 20 },
        { objectId: obj3._id, sport: S["Tenis"], name: "Teniski reket", price: 8000, stock: 8 }
    ]);
    await Equipment.create([
        { objectId: obj1._id, sport: S["Košarka"], name: "Košarkaška lopta", price: 4000, stock: 15 },
        { objectId: obj2._id, sport: S["Odbojka"], name: "Odbojkaška lopta", price: 3800, stock: 12 }
    ]);
    // promotions (one active window, one upcoming) ----------------------------
    await Promotion.create([
        { objectId: obj1._id, name: "Letnja akcija", sport: S["Fudbal"], discountType: "percent", value: 20, validFrom: dayAt(-5), validTo: dayAt(20) },
        { objectId: obj3._id, name: "Vikend tenis", sport: S["Tenis"], discountType: "fixed", value: 500, validFrom: dayAt(-2), validTo: dayAt(10) },
        { objectId: obj4._id, name: "Najava sezone", sport: S["Rukomet"], discountType: "percent", value: 15, validFrom: dayAt(7), validTo: dayAt(30) }
    ]);
    // reservations ------------------------------------------------------------
    // times relative to now for the time-gated rules:
    const in6h = addHours(now, 6); // >now, <12h  -> confirmed = NOT cancellable
    const in3h = addHours(now, 3); // >now, <12h  -> pending   = ALWAYS cancellable (edge case)
    const startedAgo = addHours(now, -0.05); // ~3 min ago today   -> inside 10-min confirm/no-show window
    await Reservation.create([
        // --- past, at obj1: feed ratings + stats, one no-show, one cancelled ---
        { resourceId: t1open._id, userId: pera._id, date: dayAt(-10), startTime: "18:00", endTime: "19:00", status: "confirmed" },
        { resourceId: t1closed._id, userId: jovana._id, date: dayAt(-8), startTime: "19:00", endTime: "20:00", status: "confirmed" },
        { resourceId: t1open._id, userId: marko._id, date: dayAt(-7), startTime: "20:00", endTime: "21:00", status: "no-show" },
        { resourceId: t1hall._id, userId: nikola._id, date: dayAt(-5), startTime: "17:00", endTime: "18:00", status: "cancelled" },
        // --- past at other objects (rating eligibility) -----------------------
        { resourceId: t2open._id, userId: marko._id, date: dayAt(-6), startTime: "18:00", endTime: "19:00", status: "confirmed" },
        { resourceId: t3clay1._id, userId: jovana._id, date: dayAt(-4), startTime: "10:00", endTime: "11:00", status: "confirmed" },
        // --- future, >12h away -> "Cancel" allowed ----------------------------
        { resourceId: t1open._id, userId: pera._id, date: dayAt(3), startTime: "18:00", endTime: "19:00", status: "confirmed" },
        { resourceId: t3clay2._id, userId: nikola._id, date: dayAt(5), startTime: "09:00", endTime: "10:00", status: "pending" },
        // --- <12h away, confirmed -> "Cancel" BLOCKED -------------------------
        { resourceId: t1closed._id, userId: pera._id, date: dayAt(in6h.getDate() === now.getDate() ? 0 : 1), startTime: hhmm(in6h), endTime: hhmm(addHours(in6h, 1)), status: "confirmed" },
        // --- <12h away, still pending (unconfirmed) -> ALWAYS cancellable -----
        { resourceId: t2closed._id, userId: marko._id, date: dayAt(in3h.getDate() === now.getDate() ? 0 : 1), startTime: hhmm(in3h), endTime: hhmm(addHours(in3h, 1)), status: "pending" },
        // --- started a few min ago -> inside the 10-min confirm/no-show window -
        { resourceId: t4open._id, userId: nikola._id, date: dayAt(0), startTime: hhmm(startedAgo), endTime: hhmm(addHours(startedAgo, 1)), status: "pending" }
    ]);
    // marko missed one reservation at obj1 (still under maxNoShows=3) ----------
    await User.updateOne({ _id: marko._id }, { $set: { noShowCounts: [{ objectId: obj1._id, count: 1 }] } });
    // ratings (each backed by a confirmed reservation at that object) ---------
    await Rating.create([
        { objectId: obj1._id, userId: pera._id, like: true, comment: "Odličan teren, preporuka!" },
        { objectId: obj1._id, userId: jovana._id, like: true, comment: "Čisto i uredno." },
        { objectId: obj1._id, userId: marko._id, like: false, comment: "Gužva u terminima." },
        { objectId: obj2._id, userId: marko._id, like: true, comment: "Dobra trava." },
        { objectId: obj3._id, userId: jovana._id, like: true, comment: "Sjajna šljaka." }
    ]);
    // trainings ---------------------------------------------------------------
    await Training.create([
        { coachId: coachFudbal._id, sportistaId: pera._id, date: dayAt(-3), startTime: "17:00", endTime: "18:00", status: "held" },
        { coachId: coachTenis._id, sportistaId: jovana._id, date: dayAt(4), startTime: "11:00", endTime: "12:00", status: "scheduled" }
    ]);
    // orders ------------------------------------------------------------------
    await Order.create([
        { userId: pera._id, items: [{ equipmentId: ballFudbal._id, quantity: 1, priceAtOrder: 3500 }], status: "picked-up" },
        { userId: jovana._id, items: [{ equipmentId: racket._id, quantity: 2, priceAtOrder: 8000 }], status: "ordered" }
    ]);
    // teammate ads + a join request -------------------------------------------
    const ad = await Teammate.create({
        sportistaId: pera._id, sport: S["Fudbal"], city: "Beograd",
        date: dayAt(2), time: "19:00", missingPlayers: 2, status: "active"
    });
    await Teammate.create({
        sportistaId: jovana._id, sport: S["Odbojka"], city: "Novi Sad",
        date: dayAt(6), time: "18:00", missingPlayers: 3, status: "active"
    });
    await JoinRequest.create({ adId: ad._id, requesterId: marko._id, status: "pending" });
    // summary -----------------------------------------------------------------
    console.log("seed done:");
    console.log("  sports:", await Sport.countDocuments());
    console.log("  users:", await User.countDocuments(), "(1 admin, 4 sportista, 3 zaposleni)");
    console.log("  objects:", await SportObject.countDocuments());
    console.log("  terrains:", await Terrain.countDocuments());
    console.log("  reservations:", await Reservation.countDocuments());
    console.log("logins -> admin/Admin123!  pera|marko|jovana|nikola / Sport123!  zoran|ana|stefan / Radnik12!");
    await mongoose.disconnect();
    process.exit(0);
}
main().catch(async (err) => {
    console.error("seed failed:", err);
    await mongoose.disconnect();
    process.exit(1);
});
//# sourceMappingURL=seed.js.map