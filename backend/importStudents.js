
import importStudentsFromCSV from "./services/studentImportService.js";

// Start importing students from the CSV file
try {
  const result = await importStudentsFromCSV();

  console.log(result.message);
} catch (error) {
  console.error("Student import failed:", error.message);
}

