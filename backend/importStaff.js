
import importStaffFromCSV from "./services/staffImportService.js";

// Start importing staff (officers/admins) from the CSV file
try {
  const result = await importStaffFromCSV();

  console.log(result.message);
} catch (error) {
  console.error("Staff import failed:", error.message);
}