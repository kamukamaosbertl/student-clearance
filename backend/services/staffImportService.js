import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import csv from "csv-parser";
import bcrypt from "bcryptjs";
import { User, Office } from "../models/index.js";

// Find the current services folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The CSV file is directly inside the backend folder
const csvFilePath = path.join(
  __dirname,
  "../must_clearance_staff.csv"
);

// Reads the CSV file and imports officers/admins into the database
const importStaffFromCSV = () => {
  return new Promise((resolve, reject) => {
    const staffMembers = [];

    // Open the CSV file
    fs.createReadStream(csvFilePath)
      .pipe(csv())

      // Read each staff member from the CSV
      .on("data", (staff) => {
        staffMembers.push(staff);
      })

      // Run after the whole CSV has been read
      .on("end", async () => {
        try {
          let importedCount = 0;
          let skippedCount = 0;

          // Officers are linked to the office matching their department
          // ("Finance", "Library", ...). Officers of an academic department
          // (e.g. "Software Engineering") belong to the Department office.
          const offices = await Office.findAll();
          const departmentOffice = offices.find((o) => o.slug === "department");
          const officeFor = (staff) => {
            if (staff.role !== "officer") return null;
            const match = offices.find(
              (o) => o.name.toLowerCase() === (staff.department || "").trim().toLowerCase()
            );
            return (match || departmentOffice)?.id ?? null;
          };

          // Process each staff member
          for (const staff of staffMembers) {

            // Skip if this email is already in the database
            const existing = await User.findOne({
              where: { email: staff.email.trim().toLowerCase() },
            });

            if (existing) {
              skippedCount++;
              continue;
            }

            // Hash the staff member's password
            const passwordHash = await bcrypt.hash(staff.password, 10);

            // Save the staff member in the users table
            await User.create({
              fullName: staff.fullName,
              email: staff.email.trim().toLowerCase(),
              department: staff.department || null,
              passwordHash,
              role: staff.role, // "officer" or "admin"
              officeId: officeFor(staff),
              isActive: true,
            });

            importedCount++;
          }

          // Report how many staff members were imported
          resolve({
            message: `${importedCount} staff members imported successfully. ${skippedCount} skipped (already existed).`,
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

export default importStaffFromCSV;