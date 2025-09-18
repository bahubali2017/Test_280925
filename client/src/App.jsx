import React, { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ToastProvider } from "./components/ToastProvider";
import { useAuthAvailability } from './contexts/AuthAvailabilityContext.jsx';
// eslint-disable-next-line no-unused-vars
import SupabaseDownBanner from './components/SupabaseDownBanner.jsx';
// import { initializeVersionChecking } from './lib/versionChecker';
import LoginPage from "./pages/LoginPage";
import ChatPage from "./pages/ChatPage";
import LegalPage from "./pages/LegalPage";
import NotFound from "./pages/not-found";

/**
 * Router component that handles application routing
 * @returns {JSX.Element} The Router component
 */
function Router() {
  const [location, setLocation] = useLocation();

  // Redirect to login if at root path
  if (location === '/') {
    setLocation('/login');
    return <div>Redirecting...</div>;
  }

  return (
    <Switch location={location}>
        {/* Login route */}
        <Route path="/login" component={LoginPage} />
        
        {/* Protected chat route */}
        <Route path="/chat">
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        </Route>
        
        {/* Legal page route */}
        <Route path="/legal" component={LegalPage} />
        
        {/* 404 route */}
        <Route component={NotFound} />
      </Switch>
    );
}

/**
 * Main application component
 * Sets up providers and renders the Router
 * @returns {JSX.Element} The App component
 */
export default function App() {
  const { supabaseUp } = useAuthAvailability();

  // Service worker registration with update forcing (prevents stale bundles)
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then(registration => {
          console.log("[SW] Service worker registered:", registration);
          
          // Force update check on app load to prevent stale bundles
          registration.update();
          
          // Listen for new service worker installations
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  // New service worker is available, reload to activate it
                  console.log("[SW] New service worker available, reloading...");
                  window.location.reload();
                }
              });
            }
          });
          
          // Handle controller changes (when new SW becomes active)
          navigator.serviceWorker.addEventListener("controllerchange", () => {
            console.log("[SW] Service worker controller changed, reloading...");
            window.location.reload();
          });
        })
        .catch(error => {
          console.error("[SW] Service worker registration failed:", error);
        });
    }
  }, []);

  return (
    <>
      {!supabaseUp && <SupabaseDownBanner />}
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </>
  );
}