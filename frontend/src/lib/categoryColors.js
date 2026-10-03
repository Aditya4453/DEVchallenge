/**
 * categoryColors.js
 * ──────────────────────────────────────────────────────────────────
 * Central source of truth for category → colour mapping.
 *
 * Known categories have hand-picked, design-consistent colours.
 * Any NEW / unknown category gets a deterministic colour derived
 * from a hash of its name, so the same category always renders
 * with the same colour across the chart, legend, and transaction log.
 * ──────────────────────────────────────────────────────────────────
 */

/** Hand-curated palette for the standard categories */
const KNOWN_CATEGORIES = {
  'Food & Dining':    { hex: '#f43f5e', tailwindBase: 'rose' },
  'Shopping':         { hex: '#c084fc', tailwindBase: 'purple' },
  'Transport':        { hex: '#fbbf24', tailwindBase: 'amber' },
  'Bills & Utilities':{ hex: '#60a5fa', tailwindBase: 'blue' },
  'Entertainment':    { hex: '#f472b6', tailwindBase: 'pink' },
  'Income':           { hex: '#34d399', tailwindBase: 'emerald' },
  'Other':            { hex: '#9ca3af', tailwindBase: 'neutral' },
};

/**
 * Simple djb2-style string hash → number in [0, 360).
 * Deterministic: same string always returns same hue.
 */
function stringToHue(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash >>> 0) % 360;
}

/**
 * Hues "too close" to the known palette are nudged by +41°
 * to keep dynamically generated colours visually distinct.
 */
const RESERVED_HUES = [350, 270, 43, 213, 330, 160, 220];

function adjustHue(hue) {
  const tooClose = RESERVED_HUES.some((h) => {
    const diff = Math.abs(((hue - h) + 360) % 360);
    return Math.min(diff, 360 - diff) < 22;
  });
  return tooClose ? (hue + 41) % 360 : hue;
}

// Runtime cache so colours are stable across renders
const _colorCache = {};

/**
 * getCategoryColor(category)
 * Returns { hex, tailwindBase } for known categories, or a generated
 * { hex, tailwindBase: null } for unknown ones.
 */
export function getCategoryColor(category) {
  if (KNOWN_CATEGORIES[category]) return KNOWN_CATEGORIES[category];

  if (!_colorCache[category]) {
    const hue = adjustHue(stringToHue(category));
    _colorCache[category] = {
      hex: `hsl(${hue}, 70%, 62%)`,
      tailwindBase: null,
    };
  }
  return _colorCache[category];
}

/**
 * getCategoryHex(category)
 * Returns a CSS colour string suitable for Chart.js backgroundColor.
 */
export function getCategoryHex(category) {
  return getCategoryColor(category).hex;
}

/**
 * getCategoryBadgeStyle(category)
 * Returns { className, style } to spread onto a badge element.
 * Known categories use Tailwind classes; unknown ones use inline styles.
 */
export function getCategoryBadgeStyle(category) {
  const { tailwindBase, hex } = getCategoryColor(category);

  if (tailwindBase) {
    return {
      className: `bg-${tailwindBase}-500/10 text-${tailwindBase}-300 border-${tailwindBase}-500/20`,
      style: {},
    };
  }

  // Dynamic category: derive readable colours from the generated hue
  return {
    className: 'border',
    style: {
      backgroundColor: `${hex}18`,   // ~10% opacity fill
      color: hex,
      borderColor: `${hex}40`,        // ~25% opacity border
    },
  };
}

export { KNOWN_CATEGORIES };
