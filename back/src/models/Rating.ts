import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema({
    objectId: { type: mongoose.Schema.Types.ObjectId, ref: 'ObjectModel', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserModel', required: true },
    like: { type: Boolean, required: true },
    comment: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
})

export default mongoose.model("RatingModel", ratingSchema, "ocene")