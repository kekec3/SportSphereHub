import mongoose from "mongoose";

const objectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    city: { type: String, required: true },
    address: { type: String, required: true },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    ownerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserModel' }],
    pricePerHour: { type: Number, required: true, min: 0 },
    workingHours: {
        open: { type: String, required: true },
        close: { type: String, required: true }
    },
    maxNoShows: { type: Number, required: true, min: 1 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserModel' }],
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserModel' }],
    photos: [{ type: String }],
    status: { type: String, enum: ['pending', 'approved'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
})

export default mongoose.model("ObjectModel", objectSchema, "objekti")