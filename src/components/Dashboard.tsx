import { useState, useEffect } from 'react';
import { 
  Bell, 
  LogOut, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Copy,
  Check,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useContract } from '@/hooks/useContract';
import { useNotifications } from '@/hooks/useNotifications';
import { PromissoryCard } from './PromissoryCard';
import { NotificationsSheet } from './NotificationsSheet';
import { SettingsSheet } from './SettingsSheet';
import { requestNotificationPermission, scheduleReminders } from '@/lib/notifications';

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const { contract, getStats, markAsPaidByDebtor, confirmPaymentByCreditor } = useContract();
  const { unreadCount } = useNotifications(user?.id);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);

  useEffect(() => {
    requestNotificationPermission();
    scheduleReminders();
  }, []);

  if (!user || !contract) return null;

  const stats = getStats();
  const isDebtor = user.role === 'debtor';

  const handleCopyPix = () => {
    if (contract.creditorPixKey) {
      navigator.clipboard.writeText(contract.creditorPixKey);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background safe-area-inset">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm text-muted-foreground">
              {isDebtor ? 'Devedor' : 'Credor'}
            </p>
            <h1 className="font-display text-lg font-bold text-foreground">
              {user.name.split(' ')[0]}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setShowNotifications(true)}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                  {unreadCount}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        {/* Stats Cards */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-card p-4 shadow-card">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.paid}</p>
            <p className="text-xs text-muted-foreground">Pagas</p>
          </div>

          <div className="rounded-xl bg-card p-4 shadow-card">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-pending/10">
              <Clock className="h-5 w-5 text-pending" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </div>

          <div className="rounded-xl bg-card p-4 shadow-card">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.overdue}</p>
            <p className="text-xs text-muted-foreground">Atrasadas</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6 rounded-xl bg-card p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Progresso</span>
            <span className="text-sm text-muted-foreground">
              {stats.paid} de {stats.total}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-secondary">
            <div 
              className="h-full rounded-full gradient-primary transition-all duration-500"
              style={{ width: `${(stats.paid / stats.total) * 100}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Pago: <span className="font-semibold text-success">R$ {stats.paidAmount.toLocaleString('pt-BR')}</span>
            </span>
            <span className="text-muted-foreground">
              Restante: <span className="font-semibold text-foreground">R$ {stats.pendingAmount.toLocaleString('pt-BR')}</span>
            </span>
          </div>
        </div>

        {/* PIX Key (for debtor) */}
        {isDebtor && contract.creditorPixKey && (
          <div className="mb-6 rounded-xl bg-card p-4 shadow-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Chave PIX do Credor</p>
                  <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                    {contract.creditorPixKey}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyPix}
                className="flex-shrink-0"
              >
                {copiedPix ? (
                  <Check className="h-5 w-5 text-success" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Promissories List */}
        <div className="space-y-3">
          <h2 className="font-display text-lg font-bold text-foreground">
            Parcelas
          </h2>
          
          {contract.promissories.map((promissory) => (
            <PromissoryCard
              key={promissory.id}
              promissory={promissory}
              userRole={user.role}
              onMarkAsPaid={isDebtor ? markAsPaidByDebtor : undefined}
              onConfirmPayment={!isDebtor ? confirmPaymentByCreditor : undefined}
            />
          ))}
        </div>
      </main>

      {/* Sheets */}
      <NotificationsSheet
        open={showNotifications}
        onOpenChange={setShowNotifications}
        userId={user.id}
      />
      
      <SettingsSheet
        open={showSettings}
        onOpenChange={setShowSettings}
        userRole={user.role}
        currentPixKey={contract.creditorPixKey}
      />
    </div>
  );
};
