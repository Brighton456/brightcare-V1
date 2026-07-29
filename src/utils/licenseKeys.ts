/**
 * License key generation and validation utilities
 * Format: XXXX-XXXX-XXXX-XXXX (alphanumeric, uppercase)
 */

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No I,O,0,1 to avoid confusion

export function generateLicenseKey(): string {
  const segments: string[] = [];
  for (let s = 0; s < 4; s++) {
    let seg = "";
    for (let i = 0; i < 4; i++) {
      seg += CHARS[Math.floor(Math.random() * CHARS.length)];
    }
    segments.push(seg);
  }
  return segments.join("-");
}

export function generateStaffPassword(): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const all = upper + lower + digits;
  
  // Ensure at least 1 upper, 1 lower, 1 digit
  let pwd = "";
  pwd += upper[Math.floor(Math.random() * upper.length)];
  pwd += lower[Math.floor(Math.random() * lower.length)];
  pwd += digits[Math.floor(Math.random() * digits.length)];
  
  for (let i = 0; i < 5; i++) {
    pwd += all[Math.floor(Math.random() * all.length)];
  }
  
  // Shuffle
  return pwd.split("").sort(() => Math.random() - 0.5).join("");
}

export function formatLicenseKey(raw: string): string {
  const clean = raw.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  const parts = [];
  for (let i = 0; i < clean.length; i += 4) {
    parts.push(clean.slice(i, i + 4));
  }
  return parts.join("-");
}

export function isValidLicenseKeyFormat(key: string): boolean {
  return /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(key);
}
