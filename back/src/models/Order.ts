import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserModel', required: true },
    items: [{
        equipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'EquipmentModel', required: true },
        quantity: { type: Number, required: true, min: 1 },
        priceAtOrder: { type: Number, required: true }
    }],
    status: { type: String, enum: ['ordered', 'picked-up', 'cancelled'], default: 'ordered' },
    createdAt: { type: Date, default: Date.now }
})

export default mongoose.model("OrderModel", orderSchema, "porudzbine")