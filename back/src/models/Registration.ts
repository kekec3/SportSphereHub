import mongoose from "mongoose"

const registrationRequestSchema = new mongoose.Schema({
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['sportista', 'zaposleni'], required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, required: true },
    avatarUrl: { type: String, default: '/uploads/avatars/default.png' },
    favoriteSports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SportModel' }],
    objectId: { type: mongoose.Schema.Types.ObjectId, ref: 'ObjectModel' },
    maticniBroj: { type: String },
    pib: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
})

export default mongoose.model("RegistrationRequestModel", registrationRequestSchema, "zahtevi_registracije")
