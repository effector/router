/** @jsxImportSource vue */
import { createRoute } from '@effector/router';
import { Link } from '@effector/router-vue';

const profile = createRoute({ path: '/profile/:id' });
const home = createRoute({ path: '/home' });

const validLink = <Link to={profile} params={{ id: '1' }} />;
void validLink;

// @ts-expect-error Link requires params for a parameterized route
const missingLink = <Link to={profile} />;
void missingLink;

// @ts-expect-error a route without params takes none
const extraLink = <Link to={home} params={{ id: '1' }} />;
void extraLink;
