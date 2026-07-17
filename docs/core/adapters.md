# Adapters

Adapters bridge effector/router with browser history APIs, enabling URL synchronization and navigation. effector/router includes two built-in adapters and supports custom adapter creation.

## Overview

An adapter translates between effector/router's internal navigation system and external history management libraries (like the `history` package). Adapters handle:

- Reading and updating URL location
- Managing browser history stack
- Listening to navigation events
- Providing back/forward navigation

Every adapter exposes a live `location` snapshot with exactly `pathname`,
`search`, and `hash`. Reading it after `push`, `replace`, or a native history
change returns the current value; it is not the object captured at creation.

`push` and `replace` accept either a full history string or a partial location
object. Any omitted field is retained from the adapter's current location; the
same rule is used for nested targets handled by `queryAdapter`.

Before `setHistory`, router state is explicit: `$path` is `null` and `$query`
is `{}`. Initialization loads the adapter snapshot atomically. Replacing the
adapter removes the previous listen/block subscriptions first.

The adapter/router lifecycle keeps these guarantees across repeated
initialization, native POP, equal snapshots, hash-only changes, and isolated
Effector Fork scopes.

## Built-in Adapters

### historyAdapter

Standard adapter for pathname-based navigation using the [`history`](https://github.com/remix-run/history) library.

**Use case:** Traditional web navigation where routes are in the URL pathname.

**Installation:**

```bash
npm install history
```

**Basic Usage:**

```ts
import { createRouter, historyAdapter } from '@effector/router';
import { createBrowserHistory } from 'history';

const router = createRouter({
  routes: [homeRoute, aboutRoute],
});

const history = createBrowserHistory();
router.setHistory(historyAdapter(history));

// Navigation changes URL pathname
aboutRoute.open();
// URL: /about
```

**With Effector Scope:**

```ts
import { allSettled, fork } from 'effector';
import { createBrowserHistory } from 'history';
import { historyAdapter } from '@effector/router';

const scope = fork();
const history = createBrowserHistory();

await allSettled(router.setHistory, {
  scope,
  params: historyAdapter(history),
});
```

**History Types:**

```ts
// Browser History - Full URLs
import { createBrowserHistory } from 'history';
const history = createBrowserHistory();
// URL: http://localhost:3000/about

// Hash History - Static hosting
import { createHashHistory } from 'history';
const history = createHashHistory();
// URL: http://localhost:3000/#/about

// Memory History - Testing, SSR, React Native
import { createMemoryHistory } from 'history';
const history = createMemoryHistory({
  initialEntries: ['/'],
  initialIndex: 0,
});
// No URL changes, all in memory
```

**React Application Example:**

```ts
import { createRoot } from 'react-dom/client';
import { Provider } from 'effector-react';
import { allSettled, fork } from 'effector';
import { createBrowserHistory } from 'history';
import { historyAdapter } from '@effector/router';

async function render() {
  const scope = fork();
  const history = createBrowserHistory();

  await allSettled(router.setHistory, {
    scope,
    params: historyAdapter(history),
  });

  createRoot(document.getElementById('root')!).render(
    <Provider value={scope}>
      <RouterProvider router={router}>
        <App />
      </RouterProvider>
    </Provider>,
  );
}

render();
```

### queryAdapter

Specialized adapter that stores navigation state in URL query parameters instead of the pathname.

**Use case:** Modal routing, tabs, embedded apps, or secondary navigation where the main URL should remain constant.

**Basic Usage:**

```ts
import { createRouter, queryAdapter } from '@effector/router';
import { createBrowserHistory } from 'history';

const router = createRouter({
  routes: [settingsModal, profileModal],
});

const history = createBrowserHistory();
router.setHistory(queryAdapter(history));

// Navigation changes query params, not pathname
settingsModal.open();
// URL: /app?%2Fsettings
```

**Navigation target (`To`):**

Both adapters accept the same `To` value and interpret it identically — they differ only in **where** the target is stored:

```ts
type To = string | Partial<RouterLocation>;
```

- A **string** is a full path, following the [`history`](https://github.com/remix-run/history) convention: `pathname[?search][#hash]` (e.g. `'/user/1?tab=info'`). It is equivalent to the matching object form `{ pathname: '/user/1', search: '?tab=info' }`.
- An **object** is a `Partial<RouterLocation>`; omitted fields fall back to `/` (pathname) or empty strings.

By default `queryAdapter` stores the **entire** target path — pathname, search and hash together — URL-encoded into a single `location.search` value, while leaving the host `pathname` and `hash` untouched:

```ts
modalRouter.push('/user/1?tab=info');
// host URL: /users?%2Fuser%2F1%3Ftab%3Dinfo
//                  └ encodeURIComponent('/user/1?tab=info')
```

Because this mode owns the whole search string, such a router and the host application cannot share other query parameters on the same URL.

**Isolated query key (`{ key }`):**

Pass a `key` to store the nested route in a single named query parameter instead of the whole search string. Every other query parameter on the host URL is preserved, so the router and the host application (or several `queryAdapter` routers) can coexist:

```ts
const modalRouter = createRouter({ routes: [userModal] });
modalRouter.setHistory(queryAdapter(history, { key: 'modal' }));

// host URL before: /users?sort=asc
userModal.open({ params: { id: '1' } });
// host URL after:  /users?sort=asc&modal=%2Fuser%2F1
//                                  └ the `sort` param is kept intact
```

The parameter's value is the nested route path, so slashes are percent-encoded (`%2F`) — the readable part is the `key`, not the slashes. Closing the route removes only that one parameter.

| Mode                   | Example URL                         | Coexists with other query params |
| ---------------------- | ----------------------------------- | -------------------------------- |
| Default (whole search) | `/users?%2Fuser%2F1`                | ❌                               |
| `{ key: 'modal' }`     | `/users?sort=asc&modal=%2Fuser%2F1` | ✅                               |

**Comparison:**

| Feature      | historyAdapter  | queryAdapter         |
| ------------ | --------------- | -------------------- |
| URL Location | Pathname        | Query parameters     |
| Example URL  | `/user/123`     | `/app?%2Fuser%2F123` |
| Use Case     | Main navigation | Modal/tab navigation |
| SEO          | ✅ Good         | ⚠️ Limited           |

**Modal Routing Example:**

```ts
// A single shared history — the modal layers on top of the main URL
const history = createBrowserHistory();

// Main router (pathname)
const mainRouter = createRouter({
  routes: [homeRoute, aboutRoute],
});
mainRouter.setHistory(historyAdapter(history));

// Modal router (isolated query key)
const modalRouter = createRouter({
  routes: [loginModal, settingsModal],
});
modalRouter.setHistory(queryAdapter(history, { key: 'modal' }));

// Navigate main route
aboutRoute.open();
// URL: /about

// Open modal — the main pathname stays, the modal lives in ?modal
loginModal.open();
// URL: /about?modal=%2Flogin

// Main route stays /about while modal changes
```

> Both routers must share the **same** `history` instance — that is how the
> query router layers its state on top of the main URL.

Built-in adapters coordinate native blocking per shared `history` instance.
There is one physical `history.block` subscription: a router command bypasses
that blocker after completing its own pre-commit lifecycle, while a native
back/forward transition retries only after every participating adapter has
released it. Unsubscribing an adapter also releases its part of a pending
native transition.

**Tab Navigation Example:**

```ts
const tabRouter = createRouter({
  routes: [overviewTab, analyticsTab, settingsTab],
});

const history = createBrowserHistory();
tabRouter.setHistory(queryAdapter(history, { key: 'tab' }));

// Switch tabs
overviewTab.open();
// URL: /app?tab=%2Foverview

analyticsTab.open();
// URL: /app?tab=%2Fanalytics

// Back button works!
history.back();
// URL: /app?tab=%2Foverview
```

## Custom Adapters

Create custom adapters to integrate with any navigation system.

### Adapter Interface

```typescript
interface RouterAdapter {
  location: RouterLocation;
  push: (to: To) => void;
  replace: (to: To) => void;
  goBack: () => void;
  goForward: () => void;
  listen: (callback: (location: RouterLocation) => void) => Subscription;
  block?: (callback: (transition: RouterTransition) => void) => Subscription;
}

interface RouterLocation {
  pathname: string;
  search: string;
  hash: string;
}

type To = string | Partial<RouterLocation>;
```

`block` is optional. It lets [`beforeNavigate`](/core/before-navigate) hold
native POP transitions and supplies `{ action, location, retry }` to controls.
Without it, router commands are still intercepted, but external browser
back/forward cannot be held reliably.

The custom adapter examples below use one helper to normalize both `To` forms. A string is parsed as a complete `pathname[?search][#hash]` target rather than treated as a pathname only:

```ts
import { parsePath } from 'history';
import type { RouterLocation, To } from '@effector/router';

function resolveTo(to: To, current: RouterLocation): RouterLocation {
  const target = typeof to === 'string' ? parsePath(to) : to;
  const resetMissingParts = typeof to === 'string';

  return {
    pathname: target.pathname ?? current.pathname,
    search: target.search ?? (resetMissingParts ? '' : current.search),
    hash: target.hash ?? (resetMissingParts ? '' : current.hash),
  };
}
```

### Creating a Custom Adapter

**Example 1: Console Logger Adapter**

```ts
import type { RouterAdapter } from '@effector/router';

function consoleAdapter(): RouterAdapter {
  const currentLocation = {
    pathname: '/',
    search: '',
    hash: '',
  };

  const listeners = new Set<(location: RouterLocation) => void>();

  const notify = () => {
    listeners.forEach((listener) => listener(currentLocation));
  };

  const navigate = (label: string, to: To) => {
    Object.assign(currentLocation, resolveTo(to, currentLocation));
    console.log(`${label}:`, currentLocation);
    notify();
  };

  return {
    location: currentLocation,

    push: (to) => navigate('Navigate to', to),
    replace: (to) => navigate('Replace with', to),

    goBack: () => {
      console.log('Go back');
    },

    goForward: () => {
      console.log('Go forward');
    },

    listen: (callback) => {
      listeners.add(callback);
      return {
        unsubscribe: () => {
          listeners.delete(callback);
        },
      };
    },
  };
}

// Use it
router.setHistory(consoleAdapter());
```

**Example 2: Local Storage Adapter**

```ts
function localStorageAdapter(): RouterAdapter {
  const STORAGE_KEY = 'router-location';

  const getLocation = (): RouterLocation => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return { pathname: '/', search: '', hash: '' };
  };

  const setLocation = (location: RouterLocation) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
  };

  const currentLocation = getLocation();
  const listeners = new Set<(location: RouterLocation) => void>();

  const updateLocation = (to: To) => {
    Object.assign(currentLocation, resolveTo(to, currentLocation));
    setLocation(currentLocation);
    listeners.forEach((listener) => listener(currentLocation));
  };

  return {
    location: currentLocation,
    push: updateLocation,
    replace: updateLocation,
    goBack: () => console.log('Back not supported'),
    goForward: () => console.log('Forward not supported'),
    listen: (callback) => {
      listeners.add(callback);
      return { unsubscribe: () => listeners.delete(callback) };
    },
  };
}
```

**Example 3: React Native Adapter**

```ts
import { Linking } from 'react-native';

function reactNativeAdapter(): RouterAdapter {
  const currentLocation: RouterLocation = {
    pathname: '/',
    search: '',
    hash: '',
  };

  const listeners = new Set<(location: RouterLocation) => void>();

  // Parse deep link URL
  const parseUrl = (url: string): RouterLocation => {
    try {
      const parsed = new URL(url);
      return {
        pathname: parsed.pathname,
        search: parsed.search,
        hash: parsed.hash,
      };
    } catch {
      return { pathname: url, search: '', hash: '' };
    }
  };

  // Initialize with current URL
  Linking.getInitialURL().then((url) => {
    if (url) {
      Object.assign(currentLocation, parseUrl(url));
    }
  });

  // Listen to deep links
  const subscription = Linking.addEventListener('url', ({ url }) => {
    Object.assign(currentLocation, parseUrl(url));
    listeners.forEach((listener) => listener(currentLocation));
  });

  const navigate = (to: To) => {
    Object.assign(currentLocation, resolveTo(to, currentLocation));

    // Update React Native navigation
    const url = `myapp://${currentLocation.pathname}${currentLocation.search}${currentLocation.hash}`;
    Linking.openURL(url);

    listeners.forEach((listener) => listener(currentLocation));
  };

  return {
    location: currentLocation,
    push: navigate,
    replace: navigate, // Same behavior as push for this adapter

    goBack: () => {
      // Handle via React Navigation or custom logic
    },

    goForward: () => {
      // Not typically supported in mobile
    },

    listen: (callback) => {
      listeners.add(callback);
      return {
        unsubscribe: () => {
          listeners.delete(callback);
          subscription.remove();
        },
      };
    },
  };
}
```

**Example 4: Electron IPC Adapter**

```ts
import { ipcRenderer } from 'electron';

function electronAdapter(): RouterAdapter {
  const currentLocation: RouterLocation = {
    pathname: '/',
    search: '',
    hash: '',
  };

  const listeners = new Set<(location: RouterLocation) => void>();

  // Listen to navigation from main process
  ipcRenderer.on('navigate', (_, location: RouterLocation) => {
    Object.assign(currentLocation, location);
    listeners.forEach((listener) => listener(currentLocation));
  });

  const navigate = (to: To) => {
    Object.assign(currentLocation, resolveTo(to, currentLocation));

    // Send to main process
    ipcRenderer.send('router-navigate', currentLocation);

    listeners.forEach((listener) => listener(currentLocation));
  };

  return {
    location: currentLocation,
    push: navigate,
    replace: navigate, // Same behavior as push for this adapter

    goBack: () => {
      ipcRenderer.send('router-back');
    },

    goForward: () => {
      ipcRenderer.send('router-forward');
    },

    listen: (callback) => {
      listeners.add(callback);
      return {
        unsubscribe: () => {
          listeners.delete(callback);
        },
      };
    },
  };
}
```

## Adapter Requirements

When creating a custom adapter, ensure:

### 1. Initial Location

Provide initial location when created:

```ts
return {
  location: {
    pathname: '/',
    search: '',
    hash: '',
  },
  // ...
};
```

### 2. Handle String and Object Navigation

Support both formats. Per the `To` contract a **string is a full path**
(`pathname[?search][#hash]`), not just a pathname — parse it (e.g. with
`parsePath` from the `history` package) so `'/about?id=1#top'` is handled the
same as its object form:

```ts
push: (to) => {
  // '/about?id=1#top' → { pathname: '/about', search: '?id=1', hash: '#top' }
  const nextLocation = resolveTo(to, currentLocation);
  Object.assign(currentLocation, nextLocation);
  notify();
};
```

### 3. Notify Listeners

Call all listeners when location changes:

```ts
const listeners = new Set<(location: RouterLocation) => void>();

const notify = () => {
  listeners.forEach((listener) => listener(currentLocation));
};

// After navigation
push: (to) => {
  // ... update location
  notify();
};
```

### 4. Return Unsubscribe Function

The `listen` method must return an object with `unsubscribe`:

```ts
listen: (callback) => {
  listeners.add(callback);

  return {
    unsubscribe: () => {
      listeners.delete(callback);
      // Cleanup any resources
    },
  };
};
```

### 5. Maintain Location State

Keep `location` property synchronized:

```ts
const adapter = {
  location: currentLocation, // Always current

  push: (to) => {
    Object.assign(currentLocation, resolveTo(to, currentLocation));
    notify();
  },
};
```

## Testing Adapters

### Test with Memory History

```ts
import { createMemoryHistory } from 'history';
import { historyAdapter } from '@effector/router';
import { allSettled, fork } from 'effector';

test('navigation works', async () => {
  const scope = fork();
  const history = createMemoryHistory({ initialEntries: ['/'] });

  await allSettled(router.setHistory, {
    scope,
    params: historyAdapter(history),
  });

  await allSettled(aboutRoute.open, { scope });

  expect(history.location.pathname).toBe('/about');
  expect(scope.getState(aboutRoute.$isOpened)).toBe(true);
});
```

### Test Custom Adapter

```ts
test('custom adapter', async () => {
  const locations: RouterLocation[] = [];
  const currentLocation = { pathname: '/', search: '', hash: '' };

  const mockAdapter: RouterAdapter = {
    location: currentLocation,
    push: (to) => {
      const location = resolveTo(to, currentLocation);
      Object.assign(currentLocation, location);
      locations.push(location);
    },
    replace: vi.fn(),
    goBack: vi.fn(),
    goForward: vi.fn(),
    listen: () => ({ unsubscribe: () => {} }),
  };

  const scope = fork();
  await allSettled(router.setHistory, { scope, params: mockAdapter });

  await allSettled(aboutRoute.open, { scope });

  expect(locations).toContainEqual({
    pathname: '/about',
    search: '',
    hash: '',
  });
});
```

## Best Practices

### Use Built-in Adapters When Possible

```ts
// ✅ Recommended for web apps
router.setHistory(historyAdapter(createBrowserHistory()));

// ✅ Recommended for modals/tabs (share the host's history instance)
modalRouter.setHistory(queryAdapter(history, { key: 'modal' }));

// ⚠️ Only create custom adapters when necessary
router.setHistory(customAdapter());
```

### Initialize Early

Set adapter before any navigation:

```ts
// ✅ Good
await allSettled(router.setHistory, { scope, params: adapter });
await allSettled(homeRoute.open, { scope });

// ❌ Bad
await allSettled(homeRoute.open, { scope });
await allSettled(router.setHistory, { scope, params: adapter });
```

### Single Adapter Instance

Create only one adapter per router:

```ts
// ✅ Good
const adapter = historyAdapter(createBrowserHistory());
router.setHistory(adapter);

// ❌ Bad
router.setHistory(historyAdapter(createBrowserHistory()));
router.setHistory(historyAdapter(createBrowserHistory())); // Different instance
```

### Clean Up Resources

Ensure proper cleanup in custom adapters:

```ts
listen: (callback) => {
  listeners.add(callback);

  // Setup subscriptions
  const subscription = externalLibrary.subscribe(callback);

  return {
    unsubscribe: () => {
      listeners.delete(callback);
      subscription.unsubscribe(); // ✅ Cleanup
    },
  };
};
```

## API Reference

### `historyAdapter(history: History): RouterAdapter`

Creates a standard pathname-based adapter.

**Parameters:**

- `history: History` - History instance from `history` package

**Returns:** `RouterAdapter`

### `queryAdapter(history: History, options?: { key?: string }): RouterAdapter`

Creates a query parameter-based adapter.

**Parameters:**

- `history: History` - History instance from `history` package
- `options.key?: string` - When set, the nested route is stored in a single query parameter with this name (e.g. `?modal=%2Fuser%2F1`) and all other query parameters are preserved. When omitted, the adapter owns the whole `location.search` (e.g. `?%2Fuser%2F1`).

**Returns:** `RouterAdapter`

### Types

```typescript
interface RouterAdapter {
  location: RouterLocation;
  push: (to: To) => void;
  replace: (to: To) => void;
  goBack: () => void;
  goForward: () => void;
  listen: (callback: (location: RouterLocation) => void) => Subscription;
  block?: (callback: (transition: RouterTransition) => void) => Subscription;
}

interface RouterLocation {
  pathname: string;
  search: string;
  hash: string;
}

type To = string | Partial<RouterLocation>;

interface Subscription {
  unsubscribe: () => void;
}
```

The built-in `historyAdapter` and `queryAdapter` implement `block`. A custom
adapter may omit it when the host platform cannot retry native transitions.

## See Also

- [createRouter](/core/create-router) - Create a router with adapters
- [createRouterControls](/core/create-router-controls) - Create navigation controls
- [trackQuery](/core/track-query) - Track query parameters
