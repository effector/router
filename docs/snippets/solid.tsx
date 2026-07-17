import { createRoute } from '@effector/router';
import { useLink } from '@effector/router-solid';

const profile = createRoute({ path: '/profile/:id' });

export function SolidQuickStart() {
  const link = useLink(profile, () => ({ id: '42' }));
  return <a href={link.path()}>Profile</a>;
}
