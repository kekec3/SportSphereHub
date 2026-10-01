import mongoose from "mongoose";

const trainingSchema = new mongoose.Schema({
    coachId: { type: mongoose.Schema.Types.ObjectId, ref: 'CoachModel', required: true },
    sportistaId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserModel', required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: { type: String, enum: ['scheduled', 'held', 'cancelled'], default: 'scheduled' }
})

export default mongoose.model("TrainingModel", trainingSchema, "treninzi")
