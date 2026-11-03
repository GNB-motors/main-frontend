import StatTile from '@/components/redesign/StatTile';

/**
 * IntelligenceSummaryTiles — the numbers at the top of the page.
 *
 * Every tile comes from the API with its own reason and its own link, so the
 * owner can always go and see what the number was made of. The order is the
 * order the API sent.
 */
export default function IntelligenceSummaryTiles({ tiles = [] }) {
  if (!tiles.length) return null;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-live="polite">
      {tiles.map((tile) => (
        <StatTile
          key={tile.key}
          label={tile.label}
          value={tile.value}
          tone={tile.severity}
          why={tile.why}
          link={tile.link}
        />
      ))}
    </div>
  );
}
