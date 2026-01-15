import { useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';

export const InstallPrompt = () => {
  const { isInstalled, isInstallable, isIOS, promptInstall } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed) return null;

  const handleInstall = async () => {
    await promptInstall();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm rounded-lg bg-card p-6 shadow-card animate-slide-up">
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary shadow-button">
            <Smartphone className="h-10 w-10 text-primary-foreground" />
          </div>
        </div>

        <h2 className="mb-2 text-center font-display text-2xl font-bold text-foreground">
          Instale o App
        </h2>
        
        <p className="mb-6 text-center text-muted-foreground">
          Instale o PromissóriasApp para uma experiência melhor com acesso rápido e notificações.
        </p>

        {isIOS ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-secondary p-4">
              <p className="text-sm text-secondary-foreground">
                <span className="font-semibold">No Safari:</span>
              </p>
              <ol className="mt-2 list-decimal list-inside text-sm text-muted-foreground space-y-1">
                <li>Toque no botão de compartilhar</li>
                <li>Role e toque em "Adicionar à Tela de Início"</li>
                <li>Toque em "Adicionar"</li>
              </ol>
            </div>
            <Button
              onClick={() => setDismissed(true)}
              variant="outline"
              className="w-full"
            >
              Entendi
            </Button>
          </div>
        ) : isInstallable ? (
          <Button
            onClick={handleInstall}
            className="w-full gradient-primary shadow-button"
          >
            <Download className="mr-2 h-5 w-5" />
            Instalar Agora
          </Button>
        ) : (
          <div className="rounded-lg bg-secondary p-4">
            <p className="text-sm text-muted-foreground text-center">
              Abra este site no Chrome ou Safari para instalar o app.
            </p>
          </div>
        )}

        <button
          onClick={() => setDismissed(true)}
          className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          Continuar no navegador
        </button>
      </div>
    </div>
  );
};
