import mongoose from "mongoose";

const promotionSchema = new mongoose.Schema({
    objectId: { type: mongoose.Schema.Types.ObjectId, ref: 'ObjectModel', required: true },
    name: { type: String, required: true },
    sport: { type: mongoose.Schema.Types.ObjectId, ref: 'SportModel', required: true },
    discountType: { type: String, enum: ['percent', 'fixed'], required: true },
    value: { type: Number, required: true, min: 0 },
    validFrom: { type: Date, required: true },
    validTo: { type: Date, required: true }
})

export default mongoose.model("PromotionModel", promotionSchema, "promocije")

