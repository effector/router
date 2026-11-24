---
'@effector/router-vue': patch
---

`<Link>` runs every merged `click` listener. Before, a wrapper around `Link` with its own `@click`, used with another `@click`, threw on click and the browser loaded the page.
