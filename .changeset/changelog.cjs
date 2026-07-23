'use strict';

/**
 * Wraps `@changesets/changelog-github` to strip the boilerplate it repeats on
 * every line. Upstream opens each entry with a link prefix and an attribution
 * that is identical for almost every entry in this repo, and renders dependency
 * bumps as a list of every contributing commit hash — a single unreadable line
 * hundreds of characters long.
 *
 * What changes:
 *   - the PR and commit links move to the end, so bullets start with content
 *   - `Thanks @<owner>!` is dropped, but kept for outside contributors
 *   - dependency bumps list the resulting versions, not the commits behind them
 */

// CommonJS is not a style choice here: changesets loads this module with
// `require()`, and the repo is `"type": "module"`.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const github = require('@changesets/changelog-github').default;

/** Attribution for this account is noise: it authors nearly every change. */
const OWNER = 'sergeysova';

const COMMIT_LINK = String.raw`\[\`[0-9a-f]+\`\]\([^)]+\)`;
const PR_LINK = String.raw`\[#\d+\]\([^)]+\)`;

/**
 * Upstream emits `\n\n- <pr> <commit> Thanks <users>! - <summary>`, with any
 * of the three prefix parts omitted when unknown.
 */
const RELEASE_LINE = new RegExp(
  String.raw`^\n\n- (?:(${PR_LINK}) )?(?:(${COMMIT_LINK}) )?(?:Thanks (.+?)! )?- ([\s\S]*)$`,
);

module.exports = {
  async getReleaseLine(changeset, type, options) {
    const line = await github.getReleaseLine(changeset, type, options);

    const match = line.match(RELEASE_LINE);
    // Leave anything we do not recognise untouched rather than mangling it.
    if (!match) return line;

    const [, pull, commit, users, summary] = match;

    const credit =
      users && !users.includes(`@${OWNER}]`) ? ` Thanks ${users}!` : '';
    const refs = [pull, commit].filter(Boolean).join(' ');
    const source = refs ? ` (${refs})` : '';

    return `\n\n- ${summary}${credit}${source}`;
  },

  getDependencyReleaseLine(changesets, dependenciesUpdated) {
    if (dependenciesUpdated.length === 0) return '';

    return [
      '- Updated dependencies:',
      ...dependenciesUpdated.map((dep) => `  - ${dep.name}@${dep.newVersion}`),
    ].join('\n');
  },
};
