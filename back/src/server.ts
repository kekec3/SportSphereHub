import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import "./models/import.js"
import { PORT, MONGO_URI } from "./config.js"
import authRouter from "./routes/authRoutes.js"
import sportRouter from "./routes/sportRoutes.js"
import objectRouter from "./routes/objectRoutes.js"
import promotionRouter from "./routes/promotionRoutes.js"
import userRouter from "./routes/userRoutes.js"
import reservationRouter from "./routes/reservationRoutes.js"
import resourceRouter from "./routes/resourceRoutes.js"
import teammateRouter from "./routes/teammateRoutes.js"   // with the other route imports
import coachRouter from "./routes/coachRoutes.js"
import trainingRouter from "./routes/trainingRoutes.js"
import equipmentRouter from "./routes/equipmentRoutes.js"
import orderRouter from "./routes/orderRoutes.js"
import ratingRouter from "./routes/ratingRoutes.js"
import statsRouter from "./routes/statsRoutes.js"
import reportRouter from "./routes/reportRoutes.js"

mongoose.connect(MONGO_URI)
    .then(() => console.log("DB connected!"))
    .catch(err => console.error("DB connection failed:", err.message))

const app = express()
app.use(cors())
app.use(express.json({ limit: "5mb" }))

app.use("/uploads", express.static("uploads"))

app.get("/health", (req, res) => res.json({ status: "ok" }))

app.use("/auth", authRouter)
app.use("/sports", sportRouter)
app.use("/objects", objectRouter)
app.use("/promotions", promotionRouter)
app.use("/users", userRouter)
app.use("/reservations", reservationRouter)
app.use("/resources", resourceRouter)
app.use("/teammates", teammateRouter)                     // with the other app.use mounts
app.use("/coaches", coachRouter)
app.use("/trainings", trainingRouter)
app.use("/equipment", equipmentRouter)
app.use("/orders", orderRouter)
app.use("/ratings", ratingRouter)
app.use("/stats", statsRouter)
app.use("/reports", reportRouter)

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`))
