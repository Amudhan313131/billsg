export function detectWardClass(text: string): 'A' | 'B1' | 'B2' | 'B2+' | 'C' | 'unknown' {
  const lower = text.toLowerCase();

  // Check B2+ before B2 to avoid false matches
  if (lower.includes('class b2+') || lower.includes('ward b2+')) return 'B2+';
  if (lower.includes('class b2') || lower.includes('ward b2')) return 'B2';
  if (lower.includes('class b1') || lower.includes('ward b1')) return 'B1';
  if (lower.includes('class a') || lower.includes('ward a')) return 'A';
  if (lower.includes('class c') || lower.includes('ward c')) return 'C';

  return 'unknown';
}
