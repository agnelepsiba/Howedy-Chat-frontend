import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { AppRoutes } from '@/routes/AppRoutes';
import { useAuthBootstrap } from '@/hooks/useAuthBootstrap';

function AppShell() {
  const { isReady } = useAuthBootstrap();

  if (!isReady) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-gray-400">
        Loading…
      </div>
    );
  }

  return <AppRoutes />;
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </Provider>
  );
}
