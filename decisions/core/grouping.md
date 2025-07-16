# Atomic router approach

—

# Argon router approach

```ts
import { group, createRoute } from '@argon-router/core';
import { createEvent, createEffect } from 'effector';

const signInRoute = createRoute({ path: '/auth/sign-in' });
const signUpRoute = createRoute({ path: '/auth/sign-up' });
const authorizationRoute = group([signInRoute, signUpRoute]);

signInRoute.open(); // authorizationRoute.$isOpened —> true
signUpRoute.open(); // authorizationRoute.$isOpened —> true
signInRoute.close(); // authorizationRoute.$isOpened —> true
signUpRoute.close(); // authorizationRoute.$isOpened —> false
```

# Note

Route grouping is important feature, with which you can create gorgeous animated interfaces.

# Conclusion

Merge argon-router approach without changes.