import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema({
    resourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'TerrainModel', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserModel', required: true },
    date: { type: Date, required: true },
    startTime: {
        type: String, required: true,
    },
    endTime: { type: String, required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'no-show', 'cancelled'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
})

export default mongoose.model("ReservationModel", reservationSchema, "rezervacije")
export type ReservationStatus = 'pending' | 'confirmed' | 'no-show' | 'cancelled';
