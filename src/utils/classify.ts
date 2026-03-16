export type ClassifiedType = 'PHONE_NUMBER' | 'PERSON_NAME' | 'UNKNOWN';

export function classifyString(value: string): ClassifiedType {
  // Simple E.164-like phone number heuristic
  if (/^\+?[1-9]\d{7,14}$/.test(value)) {
    return 'PHONE_NUMBER';
  }
  
  // Simple person name heuristic: at least two words, only letters
  if (/^[A-Za-z]+(?:\s+[A-Za-z]+)+$/.test(value.trim())) {
    return 'PERSON_NAME';
  }
  
  return 'UNKNOWN';
}
