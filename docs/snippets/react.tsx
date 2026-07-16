import { createRoute } from '@effector/router';
import { Link } from '@effector/router-react';

const home = createRoute({ path: '/home' });
const profile = createRoute({ path: '/profile/:id' });

export function ReactQuickStart() {
  return (
    <>
      <Link to={home}>Home</Link>
      <Link to={profile} params={{ id: '42' }}>
        Profile
      </Link>
    </>
  );
}
