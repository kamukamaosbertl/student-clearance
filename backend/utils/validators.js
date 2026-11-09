// Server-side input validation (section 16.0). The rules match the
// frontend's utils/validators.js so both sides accept the same input,
// but the server never trusts the client to have checked.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^0[3479]\d{8}$/;
const REG_NO_PATTERN = /^\d{4}\/[A-Z]{2,4}\/\d{2,4}\/[A-Z]{2}$/;

export const YEARS_OF_STUDY = ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Final year"];
export const CLEARANCE_REASONS = [
  "Final graduation clearance",
  "Provisional clearance",
  "Transfer clearance",
  "Other",
];

export const isEmail = (value) => typeof value === "string" && EMAIL_PATTERN.test(value.trim());
export const isPhone = (value) => typeof value === "string" && PHONE_PATTERN.test(value.trim());
export const isRegNo = (value) => typeof value === "string" && REG_NO_PATTERN.test(value.trim());

export const clean = (value, maxLength = 255) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

// Validates the information a student sends with a clearance request.
// Returns { values, errors } — errors is an object keyed by field name.
export function validateClearanceInfo(body) {
  const values = {
    contactEmail: clean(body.email).toLowerCase(),
    phone: clean(body.phone, 20),
    yearOfStudy: clean(body.yearOfStudy, 40),
    graduationYear: clean(body.graduationYear, 4),
    reason: clean(body.reason, 100),
    notes: clean(body.notes, 2000),
  };

  const errors = {};
  if (!isEmail(values.contactEmail)) errors.email = "Enter a valid email address.";
  if (!isPhone(values.phone)) errors.phone = "Enter a valid 10-digit phone number starting with 0.";
  if (!YEARS_OF_STUDY.includes(values.yearOfStudy)) errors.yearOfStudy = "Select your year of study.";

  const thisYear = new Date().getFullYear();
  const gradYear = Number(values.graduationYear);
  if (!/^\d{4}$/.test(values.graduationYear) || gradYear < thisYear - 1 || gradYear > thisYear + 5) {
    errors.graduationYear = "Select a valid graduation year.";
  }

  if (!CLEARANCE_REASONS.includes(values.reason)) errors.reason = "Select a reason for clearance.";

  return { values, errors };
}

// Password rules for accounts created or reset by an administrator
export function validateNewPassword(password) {
  if (typeof password !== "string" || password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Password must contain both letters and numbers.";
  }
  return "";
}

// Parses ?limit=&offset= safely
export function pagination(query, defaultLimit = 50, maxLimit = 200) {
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), maxLimit);
  const offset = Math.max(parseInt(query.offset, 10) || 0, 0);
  return { limit, offset };
}

// Academic year label for a date, e.g. "2026/2027" (MUST's year starts in August)
export function academicYearFor(date = new Date()) {
  const year = date.getFullYear();
  return date.getMonth() >= 7 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
}
