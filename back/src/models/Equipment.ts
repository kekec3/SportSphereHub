import mongoose from "mongoose";

const equipmentSchema = new mongoose.Schema({
    objectId: { type: mongoose.Schema.Types.ObjectId, ref: 'ObjectModel', required: true },
    sport: { type: mongoose.Schema.Types.ObjectId, ref: 'SportModel', required: true },
    name: { type: String, required: true },
    image: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 }
})

export default mongoose.model("EquipmentModel", equipmentSchema, "oprema")