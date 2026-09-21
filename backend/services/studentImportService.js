
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import csv from "csv-parser";
import bcrypt from "bcryptjs";
import { User } from "../models/index.js";

// Find the current services folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The CSV file is directly inside the backend folder
const csvFilePath = path.join(
  __dirname,
  "../must_clearance_students.csv"
);

// Reads the CSV file and imports students into the database
const importStudentsFromCSV = () => {
  return new Promise((resolve, reject) => {
    const students = [];

    // Open the CSV file
    fs.createReadStream(csvFilePath)
      .pipe(csv())

      // Read each student from the CSV
      .on("data", (student) => {
        students.push(student);
      })

      // Run after the whole CSV has been read
      .on("end", async () => {
        try {
          // Process each student
          for (const student of students) {

            // Hash the student's password
            const passwordHash = await bcrypt.hash(student.password, 10);

            // Save the student in the users table
            await User.create({
              studentId: student.studentId,
              fullName: student.fullName,
              programme: student.programme,
              faculty: student.faculty,
              department: student.department,
              passwordHash,
              role: "student",
              isActive: true,
            });
          }

          // Report how many students were imported
          resolve({
            message: `${students.length} students imported successfully.`,
          });
        } catch (error) {
          // Handle database errors
          reject(error);
        }
      })

      // Handle CSV reading errors
      .on("error", reject);
  });
};

export default importStudentsFromCSV;

