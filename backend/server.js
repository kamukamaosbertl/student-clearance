import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import sequelize from "./config/database.js";
import "./models/index.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

// Authentication routes
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("MUST Clearance backend is running!");
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error-handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

// Connect to PostgreSQL, then start the server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("PostgreSQL connected successfully!");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to PostgreSQL:", error.message);
    process.exit(1);
  }
};

startServer();