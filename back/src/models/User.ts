import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['sportista', 'zaposleni', 'admin'], required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    avatarUrl: { type: String, default: '/uploads/avatars/default.png' },
    favoriteSports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SportModel' }],
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    noShowCounts: [{
        objectId: { type: mongoose.Schema.Types.ObjectId, ref: 'ObjectModel' },
        count: { type: Number, default: 0 }
    }],
    blockedFromObjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ObjectModel' }],
    createdAt: { type: Date, default: Date.now }
})

export default mongoose.model("UserModel", userSchema, 'korisnici');
export type UserRole = 'sportista' | 'zaposleni' | 'admin';
export type UserStatus = 'pending' | 'approved' | 'rejected';
