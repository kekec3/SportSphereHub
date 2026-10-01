import mongoose from "mongoose";

const employeeDetailsSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserModel', required: true, unique: true },
    maticniBroj: { type: String, required: true, unique: true, match: /^\d{8}$/ },
    pib: { type: String, required: true, match: /^[1-9]\d{8}$/ }
})

export default mongoose.model('EmployeeModel', employeeDetailsSchema, "zaposleni")
