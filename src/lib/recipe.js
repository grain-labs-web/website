export const TOPPINGS = [
  { id: 'banana', name: 'Banana', icon: '🍌', note: 'A little mellow sweetness' },
  { id: 'berries', name: 'Berries', icon: '🫐', note: 'A bright, juicy finish' },
  { id: 'peanut', name: 'Peanut butter', icon: '🥜', note: 'Creamy meets chocolate' },
  { id: 'almonds', name: 'Almonds', icon: '🌰', note: 'For the crunch lovers' },
  { id: 'seeds', name: 'Seeds', icon: '🌱', note: 'The tiny finishing touch' },
  { id: 'chocolate', name: 'Chocolate chips', icon: '🍫', note: 'More chocolate? Always.' },
  { id: 'strawberries', name: 'Strawberries', icon: '🍓', note: 'A little berry romance' },
  { id: 'coconut', name: 'Coconut flakes', icon: '🥥', note: 'A sunny little twist' }
];
export function normalize(ids) { return TOPPINGS.filter(t => ids.includes(t.id)).map(t => t.id); }
export function fromHash(hash) {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  return params.has('oats') ? normalize((params.get('oats') || '').split(',')) : null;
}
export function recipeHash(ids) { return '#oats=' + normalize(ids).join(','); }
export function bowlName(ids) {
  if (!ids.length) return 'The chocolate original';
  if (ids.includes('banana') && ids.includes('peanut')) return 'The slow morning bowl';
  if (ids.includes('berries')) return 'The berry good bowl';
  if (ids.includes('chocolate')) return 'The chocolate daydream';
  if (ids.includes('almonds') || ids.includes('seeds')) return 'The little crunch ritual';
  return 'The golden morning bowl';
}
export function recipeText(ids) {
  const names = TOPPINGS.filter(t => ids.includes(t.id)).map(t => t.name.toLowerCase());
  return names.length ? `Start with Grain Labs Chocolate Oats, prepared according to the pack. Finish with ${names.join(', ')}. Make it your own and enjoy.` : 'Prepare Grain Labs Chocolate Oats according to the pack. Enjoy your chocolate moment, just as it is.';
}
export function cleanName(value) {
  return Array.from(value.replace(/[^\p{L}\p{M}\p{N} .'-]/gu, '').trim().replace(/\s+/g, ' ')).slice(0,24).join('');
}
export function breakfastTitle(value) {
  const name = cleanName(value);
  return name ? `${name}'s breakfast` : 'My breakfast';
}
