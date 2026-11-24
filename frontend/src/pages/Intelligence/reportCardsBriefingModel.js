export function cardsBriefing(cards) {
  const scored = cards.filter(
    (card) => Number.isFinite(card.score) && card.grade !== 'NOT_ENOUGH_DATA',
  );
  return {
    total: cards.length,
    graded: scored.length,
    ungraded: cards.length - scored.length,
    averageScore: scored.length
      ? scored.reduce((sum, card) => sum + card.score, 0) / scored.length
      : null,
    falling: cards.filter((card) => card.grade === 'FALLING').length,
    improving: scored.filter((card) => card.trend === 'UP').length,
    grades: cards.reduce((counts, card) => {
      const grade = card.grade || 'NOT_ENOUGH_DATA';
      counts[grade] = (counts[grade] || 0) + 1;
      return counts;
    }, {}),
  };
}
