import { AppProviders } from './AppProviders.tsx';
import { AppRoutes } from '../routes/AppRoutes.tsx';
export function Main() {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
}
