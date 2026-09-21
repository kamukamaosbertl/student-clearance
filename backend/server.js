import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sequelize from "./config/database.js";
import "./models/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("MUST Clearance backend is running!");
});

// Test PostgreSQL connection
sequelize
  .authenticate()
  .then(() => {
    console.log("PostgreSQL connected successfully!");
  })
  .catch((error) => {
    console.error("Unable to connect to PostgreSQL:", error.message);
  });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});