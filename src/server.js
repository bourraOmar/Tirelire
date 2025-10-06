import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/dbConfig.js";

dotenv.config();
connectDB();

const app = express();
app.use(express.json());

app.listen(process.env.PORT, () => {
  console.log(`🚀 Server running on port ${process.env.PORT}`);
});
