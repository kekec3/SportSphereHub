import mongoose from "mongoose";

const terrainSchema = new mongoose.Schema({
    objectId: { type: mongoose.Schema.Types.ObjectId, ref: 'ObjectModel', required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['open', 'closed', 'hall'], required: true },
    capacity: { type: Number, required: true, min: 1 },
    sports: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SportModel' }],
        validate: {
            validator: (v: any[]) => Array.isArray(v) && v.length > 0,
            message: "Teren mora podržavati bar jedan sport."
        }
    },
    equipmentDescription: { type: String, maxlength: 300, default: '' }
})

terrainSchema.index({ objectId: 1, name: 1 }, { unique: true })

export default mongoose.model("TerrainModel", terrainSchema, "tereni")
export type TerrainType = 'open' | 'closed' | 'hall'