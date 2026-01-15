import { useState } from 'react';
import { User, Lock, LogIn, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage = ({ onLoginSuccess }: LoginPageProps) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const result = login(name, password);
    
    if (result.success) {
      onLoginSuccess();
    } else {
      setError(result.error || 'Erro ao fazer login');
    }

    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background safe-area-inset">
      {/* Header */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl gradient-primary shadow-button">
          <span className="text-4xl font-display font-bold text-primary-foreground">P</span>
        </div>

        <h1 className="mb-2 font-display text-3xl font-bold text-foreground">
          PromissóriasApp
        </h1>
        <p className="mb-8 text-center text-muted-foreground">
          Gestão segura de promissórias e pagamentos
        </p>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-14 pl-12 text-base rounded-xl border-border bg-card"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 pl-12 text-base rounded-xl border-border bg-card"
              required
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-destructive">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="h-14 w-full rounded-xl gradient-primary shadow-button text-lg font-semibold"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <>
                <LogIn className="mr-2 h-5 w-5" />
                Entrar
              </>
            )}
          </Button>
        </form>

        {/* Demo credentials */}
        <div className="mt-8 w-full max-w-sm rounded-xl bg-secondary p-4">
          <p className="mb-2 text-sm font-medium text-secondary-foreground">
            Credenciais de teste:
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><span className="font-medium">Devedor:</span> Pedro / pedro123</p>
            <p><span className="font-medium">Credor:</span> Lindomar / lindomar123</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 text-center text-sm text-muted-foreground">
        <p>Seus dados são salvos localmente de forma segura</p>
      </div>
    </div>
  );
};
