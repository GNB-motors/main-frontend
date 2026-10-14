import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { lazy, Suspense, useEffect, useLayoutEffect } from 'react';
import LottieLoader from './components/LottieLoader';
import RequireAuth from './components/RequireAuth.jsx';
import { setNavigator } from './utils/navigation.js';
import publicRoutes from './components/routes/publicRoutes.jsx';
import superAdminRoutes from './components/routes/superAdminRoutes.jsx';
import dashboardRoutes from './components/routes/dashboardRoutes.jsx';

// Hands the router's navigate() to utils/navigation so the axios interceptor
// can redirect an expired session to /login as a route change instead of a
// `window.location` reload that discards the entire app.
function RouterBridge() {
  const navigate = useNavigate();
  useEffect(() => {
    setNavigator(navigate);
    return () => setNavigator(null);
  }, [navigate]);
  return null;
}

// React Router doesn't reset scroll on navigation. The marketing pages scroll
// the window, but the authenticated dashboard scrolls an inner `.page-content`
// div (DashboardLayout.jsx) that persists across routes via <Outlet />, so
// both need resetting on every path change, not just window.scrollTo.
function ScrollToTop() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.querySelector('.page-content')?.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Every route is lazy-loaded. Only the app shell, providers, ErrorBoundary,
// and the Suspense fallback ship in the main chunk. The dashboard layout is a
// route like any other — lazy so public (marketing) pages never pay for the
// authenticated shell: Sidebar/Navbar icons, base-ui dialogs, and axios all
// leave the entry chunk.
const DashboardLayout = lazy(() => import('./components/DashboardLayout'));

function App() {
  return (
    <>
      <RouterBridge />
      <ScrollToTop />
      <Suspense fallback={<LottieLoader isLoading />}>
        <Routes>
          {publicRoutes}

          {superAdminRoutes}

          {/* Protected Routes inside DashboardLayout */}
          <Route
            element={
              <RequireAuth>
                <DashboardLayout />
              </RequireAuth>
            }
          >
            {dashboardRoutes}
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
