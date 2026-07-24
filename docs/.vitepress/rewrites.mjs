// Single source of truth for VitePress `rewrites`: keeps old sidebar URLs
// working for files that moved into the reference/explanation Diataxis
// folders. Consumed by config.mts (as the live `rewrites` option) and by
// scripts/check-doc-links.mjs (to resolve old URLs back to their new file
// location when validating links).
export const rewrites = {
  // Specific, single-file rules must come before the generic per-directory
  // patterns below — 'core/navigation-lifecycle.md' would otherwise also
  // match 'reference/core/:page.md' and resolve to a file that no longer
  // exists there. Destination-to-source resolution tries rules in this order.
  'explanation/navigation-lifecycle.md': 'core/navigation-lifecycle.md',
  'reference/core/:page.md': 'core/:page.md',
  'reference/react/:page.md': 'react/:page.md',
  'reference/vue/:page.md': 'vue/:page.md',
  'reference/solid/:page.md': 'solid/:page.md',
  'reference/react-native/:page.md': 'react-native/:page.md',
};

function toMatcher(pattern) {
  const paramNames = [];
  const regexSource = pattern
    .replace(/[.]/g, '\\.')
    .replace(/:([A-Za-z0-9_]+)/g, (_match, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });
  return { regex: new RegExp(`^${regexSource}$`), paramNames };
}

const destinationMatchers = Object.entries(rewrites).map(
  ([source, destination]) => ({ source, ...toMatcher(destination) }),
);

// Given a docs-root-relative destination path (the served URL, e.g.
// 'core/adapters.md'), return the docs-root-relative source path the file
// actually lives at (e.g. 'reference/core/adapters.md'), or null if this
// path isn't affected by any rewrite.
export function resolveRewrittenSource(relativeDestination) {
  for (const { source, regex, paramNames } of destinationMatchers) {
    const match = relativeDestination.match(regex);
    if (!match) continue;
    let resolved = source;
    paramNames.forEach((name, index) => {
      resolved = resolved.replace(`:${name}`, match[index + 1]);
    });
    return resolved;
  }
  return null;
}
