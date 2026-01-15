import { useState } from 'react';
import { CreditCard, Save, Bell, BellOff, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useContract } from '@/hooks/useContract';
import { requestNotificationPermission } from '@/lib/notifications';
import { toast } from 'sonner';

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole: 'debtor' | 'creditor';
  currentPixKey?: string;
}

export const SettingsSheet = ({
  open,
  onOpenChange,
  userRole,
  currentPixKey,
}: SettingsSheetProps) => {
  const { updateCreditorPixKey } = useContract();
  const [pixKey, setPixKey] = useState(currentPixKey || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    'Notification' in window && Notification.permission === 'granted'
  );
  const [saved, setSaved] = useState(false);

  const handleSavePixKey = () => {
    updateCreditorPixKey(pixKey);
    setSaved(true);
    toast.success('Chave PIX salva com sucesso!');
    setTimeout(() => setSaved(false), 2000);
  };

  const handleToggleNotifications = async () => {
    if (!notificationsEnabled) {
      const granted = await requestNotificationPermission();
      setNotificationsEnabled(granted);
      if (granted) {
        toast.success('Notificações ativadas!');
      } else {
        toast.error('Permissão de notificações negada');
      }
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md bg-background">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle className="font-display text-xl">Configurações</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Notifications */}
          <div className="rounded-xl bg-card p-4 shadow-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  {notificationsEnabled ? (
                    <Bell className="h-5 w-5 text-primary" />
                  ) : (
                    <BellOff className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">Notificações</p>
                  <p className="text-sm text-muted-foreground">
                    {notificationsEnabled ? 'Ativadas' : 'Desativadas'}
                  </p>
                </div>
              </div>
              {!notificationsEnabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleNotifications}
                >
                  Ativar
                </Button>
              )}
            </div>
          </div>

          {/* PIX Key (creditor only) */}
          {userRole === 'creditor' && (
            <div className="rounded-xl bg-card p-4 shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Chave PIX</p>
                  <p className="text-sm text-muted-foreground">
                    Para receber pagamentos
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Input
                  placeholder="CPF, e-mail, telefone ou chave aleatória"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  className="h-12"
                />
                <Button
                  onClick={handleSavePixKey}
                  className="w-full gradient-primary shadow-button"
                  disabled={!pixKey.trim()}
                >
                  {saved ? (
                    <>
                      <Check className="mr-2 h-5 w-5" />
                      Salvo!
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-5 w-5" />
                      Salvar Chave PIX
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Contract Info */}
          <div className="rounded-xl bg-card p-4 shadow-card">
            <h3 className="font-medium text-foreground mb-3">Informações do Contrato</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor Total</span>
                <span className="font-medium text-foreground">R$ 20.000,00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Parcelas</span>
                <span className="font-medium text-foreground">20x de R$ 1.000,00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vencimento</span>
                <span className="font-medium text-foreground">Todo dia 10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Local</span>
                <span className="font-medium text-foreground">Bicas - MG</span>
              </div>
            </div>
          </div>

          {/* App Info */}
          <div className="text-center text-sm text-muted-foreground">
            <p>PromissóriasApp v1.0</p>
            <p className="mt-1">Seus dados são armazenados localmente</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
