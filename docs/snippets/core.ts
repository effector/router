import { createRoute, createRouter } from '@effector/router';

const home = createRoute({ path: '/home' });
const user = createRoute({ path: '/users/:id' });
const router = createRouter({ routes: [home, user] });

home.open();
user.open({ params: { id: '42' } });
void router;
