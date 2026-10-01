import mongoose from "mongoose";

const coachSceham = new mongoose.Schema({
    name: { type: String, required: true },
    objectId: { type: mongoose.Schema.Types.ObjectId, ref: 'ObjectModel', required: true },
    sport: { type: mongoose.Schema.Types.ObjectId, ref: 'SportModel', required: true },
    specialization: { type: String, required: true },
    pricePerHour: { type: Number, required: true, min: 0 },
    avgRating: { type: Number, default: 0, min: 0, max: 5 },
    active: { type: Boolean, default: true }
})

export default mongoose.model("CoachModel", coachSceham, "treneri")
