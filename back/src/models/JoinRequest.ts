import mongoose from "mongoose";

const joinRequestSchema = new mongoose.Schema({
    adId: { type: mongoose.Schema.Types.ObjectId, ref: 'TeammateModel', required: true },
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserModel', required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
})

export default mongoose.model("JoinRequestModel", joinRequestSchema, "zahtevi")