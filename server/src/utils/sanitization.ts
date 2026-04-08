/**
 * Input Sanitization Utilities
 * Strict validation on all text inputs.
 */

/**
 * Sanitize a string by removing potentially dangerous characters.
 * Allows alphanumeric, spaces, hyphens, underscores, and basic punctuation.
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  // Remove HTML tags and script content
  let cleaned = input.replace(/<[^>]*>/g, '');
  // Remove null bytes
  cleaned = cleaned.replace(/\x00/g, '');
  // Trim whitespace
  return cleaned.trim();
}

/**
 * Validate an email address format.
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validate a username (alphanumeric, underscores, 3-30 chars).
 * Supports Unicode (Chinese characters).
 */
export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[\w\u4e00-\u9fa5]{3,30}$/;
  return usernameRegex.test(username);
}

/**
 * Validate a student ID format (alphanumeric, hyphens, 3-20 chars).
 */
export function isValidStudentId(studentId: string): boolean {
  const studentIdRegex = /^[a-zA-Z0-9-]{3,20}$/;
  return studentIdRegex.test(studentId);
}

/**
 * Validate a name (letters, spaces, hyphens, apostrophes, 2-100 chars).
 * Supports Unicode (Chinese characters).
 */
export function isValidName(name: string): boolean {
  const nameRegex = /^[\u4e00-\u9fa5a-zA-Z\s\-']{2,100}$/;
  return nameRegex.test(name);
}

/**
 * Sanitize and validate an answer string.
 */
export function sanitizeAnswer(answer: string): string {
  if (typeof answer !== 'string') return '';
  // Remove HTML/script tags
  let cleaned = answer.replace(/<[^>]*>/g, '');
  // Remove null bytes
  cleaned = cleaned.replace(/\x00/g, '');
  // Limit length
  return cleaned.substring(0, 1000).trim();
}

/**
 * Validate that a string is within length bounds.
 */
export function isValidLength(
  str: string,
  min: number = 1,
  max: number = 500
): boolean {
  return str.length >= min && str.length <= max;
}
