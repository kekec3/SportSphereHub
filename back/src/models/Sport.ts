import mongoose from "mongoose";

const sportSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }
})

export default mongoose.model("SportModel", sportSchema, "sport")