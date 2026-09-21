const REG_NO_PATTERN = /^\d{4}\/[A-Z]{2,4}\/\d{2,4}\/[A-Z]{2}$/;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PHONE_PATTERN = /^0[3479]\d{8}$/;

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

export function validateRegNo(value) {
  if (!value.trim()) return "Registration number is required.";

  if (!REG_NO_PATTERN.test(value.trim())) {
    return "Use the format 2023/BSE/058/PS.";
  }

  return "";
}

export function validatePassword(value) {
  if (!value) return "Password is required.";

  if (value.length < 6) {
    return "Password must be at least 6 characters.";
  }

  return "";
}

export function validateEmail(value) {
  if (!value.trim()) return "Email address is required.";

  if (!EMAIL_PATTERN.test(value.trim())) {
    return "Enter a valid email address.";
  }

  return "";
}

export function validatePhone(value) {
  if (!value.trim()) return "Phone number is required.";

  if (!PHONE_PATTERN.test(value.trim())) {
    return "Enter a valid 10-digit number starting with 0 (e.g. 0700123456).";
  }

  return "";
}

export function validateRequiredSelect(value, fieldLabel) {
  if (!value) return `${fieldLabel} is required.`;

  return "";
}

export function validateFile(file) {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return `${file.name}: only PDF, JPG or PNG files are allowed.`;
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `${file.name}: file is larger than 5MB.`;
  }

  return "";
}

export function validateFiles(files) {
  return files.map(validateFile).filter(Boolean);
}

export function validateAtLeastOneFile(files) {
  if (files.length === 0) {
    return "Attach at least one supporting document.";
  }

  return "";
}