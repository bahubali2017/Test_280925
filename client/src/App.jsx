import { Router, Route, Switch, Redirect } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks/useAuth.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import ChatPage from './pages/ChatPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import LegalPage from './pages/LegalPage.jsx';
import NotFoundPage from './pages/not-found.jsx';
import { queryClient } from './lib/queryClient.jsx';
import { ToastProvider } from './components/ToastProvider.jsx';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary.jsx';
import './index.css';

export default function App() {
  console.log('[App] Rendering main application');
  
  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <Router>
              <Switch>
                <Route path="/login" component={LoginPage} />
                <Route path="/legal" component={LegalPage} />
                <Route path="/chat">
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                </Route>
                <Route path="/">
                  <ProtectedRoute>
                    <Redirect to="/chat" />
                  </ProtectedRoute>
                </Route>
                <Route component={NotFoundPage} />
              </Switch>
            </Router>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
}