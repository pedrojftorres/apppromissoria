import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoginPage } from '@/components/LoginPage';
import { Dashboard } from '@/components/Dashboard';
import { InstallPrompt } from '@/components/InstallPrompt';
import { usePWA } from '@/hooks/usePWA';

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { isInstalled } = usePWA();
  const [showApp, setShowApp] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setShowApp(true);
    }
  }, [isLoading]);

  if (isLoading || !showApp) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-2xl gradient-primary shadow-button flex items-center justify-center animate-pulse-soft">
            <span className="text-2xl font-display font-bold text-primary-foreground">P</span>
          </div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Install prompt - shows for non-installed users */}
      {!isInstalled && <InstallPrompt />}
      
      {/* Main app */}
      {isAuthenticated ? (
        <Dashboard />
      ) : (
        <LoginPage onLoginSuccess={() => window.location.reload()} />
      )}
    </>
  );
};

export default Index;
