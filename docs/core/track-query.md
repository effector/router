# trackQuery

Track specific query parameters in the URL with schema validation. When the
specified parameters appear in the URL and match the schema, the tracker
enters; when they're removed, invalid, or no selected route is open, it exits.

## API

```typescript
trackQuery<T extends ZodType>(config: {
  controls: RouterControls;
  routes?: Route[];
  parameters: T;
}): QueryTracker<T>
```

### Config

| Parameter    | Type             | Description                                                |
| ------------ | ---------------- | ---------------------------------------------------------- |
| `controls`   | `RouterControls` | Controls that own query navigation                         |
| `routes`     | `Route[]`        | Optional OR filter based on each route's `$isOpened` store |
| `parameters` | `ZodType`        | Zod schema for query parameter validation                  |

When navigation switches between registered routes in `routes`, the tracker
keeps the activity change atomic: it does not emit a transient `exited` while
the target route is pending. The target query is validated after that route
opens. If target activation fails, an already entered tracker exits.

### Returns

`QueryTracker<T>` with the following properties:

| Property  | Type                                         | Description                            |
| --------- | -------------------------------------------- | -------------------------------------- |
| `enter`   | `Event<z.infer<T>>`                          | Programmatically add parameters to URL |
| `entered` | `Event<z.infer<T>>`                          | Fires when parameters match schema     |
| `exit`    | `Event<{ ignoreParams?: string[] } \| void>` | Programmatically remove parameters     |
| `exited`  | `Event<void>`                                | Fires when parameters no longer match  |

`enter` accepts only keys declared by the schema and URL-compatible values:
`string`, `null`, or ordered arrays of those values. Convert numbers, dates,
booleans, and other domain values before calling `enter`. `entered` publishes
the schema's parsed output, so a schema transform may expose domain values to
listeners without widening the URL input contract.

`enter` merges only the supplied schema keys into the current query. `exit`
removes schema-owned keys while preserving unrelated keys; pass
`ignoreParams` to preserve selected keys explicitly. Route activation and
deactivation use the same ownership rules.

The query matrix covers flags, repeated keys, empty arrays, reserved-character
encoding, path-only navigation, explicit clears, route-less and OR-filtered
trackers, transformed schemas, enter/exit ownership, and adapter round trips.

## Usage

### Basic Query Tracking

```ts
import {
  createRoute,
  createRouter,
  createRouterControls,
  trackQuery,
} from '@effector/router';
import { z } from 'zod';

const searchRoute = createRoute({ path: '/search' });

const controls = createRouterControls();
const router = createRouter({
  routes: [searchRoute],
  controls,
});

// Track search query parameter
const searchTracker = trackQuery({
  controls,
  parameters: z.object({
    q: z.string(),
  }),
  routes: [searchRoute],
});

// Listen when search query appears
sample({
  clock: searchTracker.entered,
  fn: (params) => console.log('Search query:', params.q),
});

// Listen when search query is removed
sample({
  clock: searchTracker.exited,
  fn: () => console.log('Search cleared'),
});
```

### Gate a tracker externally

`trackQuery` reacts continuously and has no `check` clock. Compose one-shot or
application-readiness policy from ordinary Effector units:

```ts
import {
  createRouter,
  createRouterControls,
  createRoute,
  trackQuery,
} from '@effector/router';
import { sample } from 'effector';
import { z } from 'zod';
import { acceptInvitationFx } from '@shared/api';
import { $appStarted } from '@shared/global';

const familyRoute = createRoute({ path: '/search' });
const controls = createRouterControls();
const router = createRouter({
  routes: [familyRoute],
  controls,
});

const invitationTracker = trackQuery({
  controls,
  routes: [familyRoute],
  parameters: z.object({
    inviteId: z.string(),
  }),
});

sample({
  clock: invitationTracker.entered,
  filter: $appStarted,
  target: acceptInvitationFx,
});
```

### Add/Remove Query Parameters

```ts
import { z } from 'zod';

const filterTracker = trackQuery({
  controls,
  parameters: z.object({
    status: z.enum(['active', 'inactive']),
    category: z.string(),
  }),
  routes: [productsRoute],
});

// Add filters to URL
filterTracker.enter({
  status: 'active',
  category: 'electronics',
});
// URL becomes: /products?status=active&category=electronics

// Remove all tracked parameters
filterTracker.exit();
// URL becomes: /products

// Remove tracked parameters but keep others
filterTracker.exit({ ignoreParams: ['page'] });
// Removes status and category, keeps page param
```

### Pagination

```ts
import { z } from 'zod';

const paginationTracker = trackQuery({
  controls,
  parameters: z.object({
    page: z.string().regex(/^\d+$/),
    limit: z.string().regex(/^\d+$/),
  }),
  routes: [listRoute],
});

// Go to page 2
paginationTracker.enter({ page: '2', limit: '20' });

// Reset to first page
paginationTracker.exit();
```

### Optional Parameters

```ts
import { z } from 'zod';

const advancedSearchTracker = trackQuery({
  controls,
  parameters: z.object({
    q: z.string(),
    tags: z.array(z.string()).optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
  }),
  routes: [searchRoute],
});

// Required query only
advancedSearchTracker.enter({ q: 'laptop' });

// With optional parameters
advancedSearchTracker.enter({
  q: 'laptop',
  tags: ['electronics', 'computers'],
  minPrice: '500',
  maxPrice: '2000',
});
```

### Multiple Trackers

```ts
import { z } from 'zod';

// Track search independently
const searchTracker = trackQuery({
  controls,
  parameters: z.object({ q: z.string() }),
  routes: [searchRoute],
});

// Track filters independently
const filterTracker = trackQuery({
  controls,
  parameters: z.object({
    category: z.string(),
    status: z.string(),
  }),
  routes: [searchRoute],
});

// Track sort independently
const sortTracker = trackQuery({
  controls,
  parameters: z.object({
    sort: z.enum(['asc', 'desc']),
    sortBy: z.string(),
  }),
  routes: [searchRoute],
});

// Each tracker manages its own parameters
searchTracker.enter({ q: 'phone' });
filterTracker.enter({ category: 'mobile', status: 'active' });
sortTracker.enter({ sort: 'asc', sortBy: 'price' });
// URL: /search?q=phone&category=mobile&status=active&sort=asc&sortBy=price
```

### With Router Controls

```ts
import { createRouterControls, trackQuery } from '@effector/router';
import { z } from 'zod';

const controls = createRouterControls();

// Omitting routes keeps the tracker active for every location.
const themeTracker = trackQuery({
  controls,
  parameters: z.object({
    theme: z.enum(['light', 'dark']),
  }),
});

// Theme parameter works on all routes
themeTracker.enter({ theme: 'dark' });
```

### React Integration

```tsx
import { useUnit } from 'effector-react';
import { z } from 'zod';

const filterTracker = trackQuery({
  controls,
  parameters: z.object({
    search: z.string(),
    category: z.string().optional(),
  }),
  routes: [productsRoute],
});

function ProductFilters() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const handleApplyFilters = () => {
    filterTracker.enter({
      search,
      ...(category && { category }),
    });
  };

  const handleClearFilters = () => {
    filterTracker.exit();
    setSearch('');
    setCategory('');
  };

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search..."
      />
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="">All Categories</option>
        <option value="electronics">Electronics</option>
        <option value="clothing">Clothing</option>
      </select>
      <button onClick={handleApplyFilters}>Apply</button>
      <button onClick={handleClearFilters}>Clear</button>
    </div>
  );
}
```

### Store Parsed Query Parameters

The `entered` event carries the parsed `z.infer<T>` value, so it can update a store directly:

```ts
import { createStore, sample } from 'effector';
import { z } from 'zod';

const searchTracker = trackQuery({
  controls,
  parameters: z.object({
    q: z.string(),
    page: z.coerce.number().default(1),
  }),
  routes: [searchRoute],
});

const $searchQuery = createStore({ q: '', page: 1 });

sample({
  clock: searchTracker.entered,
  target: $searchQuery,
});

sample({
  clock: searchTracker.exited,
  target: $searchQuery.reinit,
});
```

### Load Data on Query Change

```ts
import { sample } from 'effector';
import { z } from 'zod';

const searchTracker = trackQuery({
  controls,
  parameters: z.object({
    q: z.string(),
    page: z.string().optional(),
  }),
  routes: [searchRoute],
});

const loadSearchResultsFx = createEffect(
  async (params: { q: string; page?: string }) => {
    return await fetchSearchResults(params);
  },
);

// Load results when search query is entered
sample({
  clock: searchTracker.entered,
  target: loadSearchResultsFx,
});

// Clear results when search is exited
sample({
  clock: searchTracker.exited,
  target: $searchResults.reinit,
});
```

### Validation Handling

```ts
import { z } from 'zod';

const strictPaginationTracker = trackQuery({
  controls,
  parameters: z.object({
    page: z
      .string()
      .regex(/^\d+$/)
      .refine((val) => parseInt(val) > 0),
    limit: z.enum(['10', '20', '50', '100']),
  }),
  routes: [listRoute],
});

// ✅ Valid - tracker enters
// URL: /list?page=1&limit=20

// ❌ Invalid - tracker won't enter or will exit
// URL: /list?page=0&limit=20      (page must be > 0)
// URL: /list?page=abc&limit=20    (page must be number)
// URL: /list?page=1&limit=30      (limit must be 10/20/50/100)
```

## How It Works

1. **Validation**: Continuously validates current query parameters against the schema
2. **Entered**: When parameters match the schema, `entered` fires with validated data
3. **Exited**: When parameters no longer match (removed or invalid), `exited` fires
4. **Route Filtering**: If `routes` is specified, only tracks when those routes are active

## Best Practices

### Use Specific Schemas

Define precise validation rules:

```ts
// ✅ Good: Specific validation
const tracker = trackQuery({
  controls,
  parameters: z.object({
    page: z
      .string()
      .regex(/^\d+$/)
      .refine((val) => parseInt(val) > 0),
    sortBy: z.enum(['name', 'date', 'price']),
  }),
  routes: [listRoute],
});

// ❌ Bad: Too permissive
const tracker = trackQuery({
  controls,
  parameters: z.object({
    page: z.any(),
    sortBy: z.string(),
  }),
  routes: [listRoute],
});
```

### Scope to Routes

Only track query parameters for relevant routes:

```ts
// ✅ Good: Scoped to search route
const searchTracker = trackQuery({
  controls,
  parameters: z.object({ q: z.string() }),
  routes: [searchRoute],
});

// ❌ Bad: Tracks on all routes (unless intended)
const searchTracker = trackQuery({
  controls,
  parameters: z.object({ q: z.string() }),
});
```

### Separate Concerns

Create separate trackers for different parameter groups:

```ts
// ✅ Good: Separate trackers for independent concerns
const searchTracker = trackQuery({
  controls,
  parameters: z.object({ q: z.string() }),
  routes: [searchRoute],
});

const paginationTracker = trackQuery({
  controls,
  parameters: z.object({ page: z.string() }),
  routes: [searchRoute],
});

// ❌ Bad: Mixed concerns
const mixedTracker = trackQuery({
  controls,
  parameters: z.object({
    q: z.string(),
    page: z.string(),
    theme: z.string(),
  }),
  routes: [searchRoute],
});
```

## See Also

- [createRouter](/core/create-router) - Register routes and bind controls to history
- [createRouterControls](/core/create-router-controls) - Create controls for standalone operators
