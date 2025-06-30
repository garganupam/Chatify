import express from "express";
import { connectDB } from "./lib/db.js";
import dotenv from "dotenv";
import cookieParser from "cookie-parser"
import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.routes.js"
import cors from "cors"
import {app,server} from "./lib/socket.js"
dotenv.config();

const PORT = process.env.PORT;


// Middleware to parse incoming JSON bodies — must be before routes
app.use(express.json({limit:'10mb'}));
app.use(express.urlencoded({limit:'10mb',extended:true}));
app.use(cookieParser());
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true
}))

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);


server.listen(PORT, () => {
    console.log("Server is running on port:", PORT);
    connectDB();
});
