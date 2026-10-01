import mongoose from "mongoose";

const teammateSchema = new mongoose.Schema({
    sportistaId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserModel', required: true },
    sport: { type: mongoose.Schema.Types.ObjectId, ref: 'SportModel', required: true },
    city: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    missingPlayers: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['active', 'closed'], default: 'active' }
})

export default mongoose.model("TeammateModel", teammateSchema, "saigraci")