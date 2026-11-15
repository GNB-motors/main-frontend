/** Place types accepted by the place-question API, with labels used in the UI. */
export const PLACE_CATEGORIES = [
  { value: 'PLANT', label: 'Plant' },
  { value: 'LOADING', label: 'Loading point / siding' },
  { value: 'UNLOADING', label: 'Delivery / unloading point' },
  { value: 'WAREHOUSE', label: 'Warehouse' },
  { value: 'YARD', label: 'Yard' },
  { value: 'FUEL_PUMP', label: 'Fuel pump' },
  { value: 'DHABA', label: 'Dhaba / food stop' },
  { value: 'PARKING', label: 'Parking' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'SERVICE', label: 'Service centre' },
  { value: 'TOLL', label: 'Toll plaza' },
  { value: 'CHECKPOST', label: 'Checkpost' },
  { value: 'UNKNOWN', label: 'Other / type unknown' },
];

const ALIASES = { SIDING: 'LOADING', CUSTOMER: 'UNLOADING', PUMP: 'FUEL_PUMP', FUEL: 'FUEL_PUMP' };

export function placeCategory(value) {
  const raw = String(value || '')
    .trim()
    .toUpperCase();
  const category = ALIASES[raw] || raw;
  return PLACE_CATEGORIES.some((option) => option.value === category) ? category : 'UNKNOWN';
}

export function placeCategoryLabel(value) {
  return PLACE_CATEGORIES.find((option) => option.value === placeCategory(value)).label;
}

/** Send the same suggested name and type the owner reviewed. */
export function suggestedPlaceAnswer(question) {
  return {
    answer: 'CONFIRM',
    name: question.suggestion.name.trim(),
    category: placeCategory(question.suggestion.category),
  };
}

export default PLACE_CATEGORIES;
