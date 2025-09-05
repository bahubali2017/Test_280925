/**
 * Flag negations like "no fever", "not diabetic".
 * @param {string} text
 * @returns {(phrase: string)=>boolean} predicate to check if a phrase is negated in the text
 */
export function makeNegationPredicate(text) {
  const t = ` ${String(text).toLowerCase()} `;
  return (phrase) => {
    const p = String(phrase).toLowerCase();
    // naive window: look for "no/without/not" within 3 words before the phrase
    const idx = t.indexOf(` ${p} `);
    if (idx < 0) return false;
    const window = t.slice(Math.max(0, idx - 40), idx); // ~3-5 words back
    return /\b(no|not|without|never)\b/.test(window);
  };
}