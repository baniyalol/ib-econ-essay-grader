/**
 * Locate a quote inside the essay, tolerating minor casing differences
 * without losing the original essay's formatting when we display it.
 *
 * Returns a character index into the original essay, or -1 if not found.
 */
export function findQuoteIndex(essay: string, quote: string): number {
  if (!essay || !quote) return -1;
  const direct = essay.indexOf(quote);
  if (direct !== -1) return direct;
  const lowerIdx = essay.toLowerCase().indexOf(quote.toLowerCase());
  if (lowerIdx !== -1) return lowerIdx;
  return -1;
}

export function quoteIsInEssay(essay: string, quote?: string): boolean {
  return !!quote && findQuoteIndex(essay, quote) !== -1;
}
