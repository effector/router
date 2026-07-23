import { createRoute } from '@effector/router';
import type { ValidatePath } from '@effector/router-paths';
import { Link } from '@effector/router-react';
import type { NativeNavigatorProps } from '@effector/router-react-native';
import type {
  NavigationContainerRefWithCurrent,
  ParamListBase,
} from '@react-navigation/native';

const profile = createRoute({ path: '/profile/:id' });
// @ts-expect-error required route params must be supplied
profile.open();

// @ts-expect-error full URLs are rejected by the public path validator
const fullUrl: ValidatePath<'https://example.com/profile'> =
  'https://example.com/profile';

// @ts-expect-error Link requires params for a parameterized route
const missingLink = <Link to={profile}>Profile</Link>;
void missingLink;

const navigationRef =
  undefined as unknown as NavigationContainerRefWithCurrent<ParamListBase>;
// @ts-expect-error the app-owned navigation ref is required by the RN navigator
const missingNativeRef: NativeNavigatorProps = {};
void navigationRef;
void missingNativeRef;
void fullUrl;
