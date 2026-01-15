import { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileCheck,
  Upload,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Promissory } from '@/types/promissory';

interface PromissoryCardProps {
  promissory: Promissory;
  userRole: 'debtor' | 'creditor';
  onMarkAsPaid?: (id: string, receiptUrl?: string) => void;
  onConfirmPayment?: (id: string) => void;
}

export const PromissoryCard = ({
  promissory,
  userRole,
  onMarkAsPaid,
  onConfirmPayment,
}: PromissoryCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const dueDate = new Date(promissory.dueDate);
  const isOverdue = dueDate < new Date() && promissory.status === 'pending';
  const formattedDate = dueDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const getStatusInfo = () => {
    if (promissory.status === 'confirmed') {
      return {
        icon: CheckCircle2,
        label: 'Confirmada',
        color: 'text-success',
        bgColor: 'bg-success/10',
      };
    }
    if (promissory.status === 'paid_by_debtor') {
      return {
        icon: FileCheck,
        label: 'Aguardando Confirmação',
        color: 'text-pending',
        bgColor: 'bg-pending/10',
      };
    }
    if (isOverdue) {
      return {
        icon: AlertTriangle,
        label: 'Atrasada',
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
      };
    }
    return {
      icon: Clock,
      label: 'Pendente',
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
    };
  };

  const status = getStatusInfo();
  const StatusIcon = status.icon;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setReceiptPreview(result);
        onMarkAsPaid?.(promissory.id, result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMarkAsPaid = () => {
    onMarkAsPaid?.(promissory.id);
  };

  return (
    <div className={`rounded-xl bg-card shadow-card overflow-hidden transition-all duration-200 ${
      isOverdue ? 'ring-2 ring-destructive/30' : ''
    }`}>
      {/* Main row */}
      <div 
        className="flex items-center gap-4 p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${status.bgColor}`}>
          <StatusIcon className={`h-6 w-6 ${status.color}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-foreground">
              #{promissory.number.toString().padStart(2, '0')}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${status.bgColor} ${status.color}`}>
              {status.label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Vence: {formattedDate}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-foreground">
            R$ {promissory.amount.toLocaleString('pt-BR')}
          </span>
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border p-4 space-y-4 animate-fade-in">
          {/* Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Valor</p>
              <p className="font-medium text-foreground">R$ 1.000,00</p>
            </div>
            <div>
              <p className="text-muted-foreground">Forma</p>
              <p className="font-medium text-foreground">PIX</p>
            </div>
            {promissory.paidAt && (
              <div>
                <p className="text-muted-foreground">Pago em</p>
                <p className="font-medium text-foreground">
                  {new Date(promissory.paidAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
            {promissory.creditorConfirmedAt && (
              <div>
                <p className="text-muted-foreground">Confirmado em</p>
                <p className="font-medium text-foreground">
                  {new Date(promissory.creditorConfirmedAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
          </div>

          {/* Receipt preview */}
          {promissory.receiptUrl && (
            <div className="rounded-lg border border-border p-3">
              <p className="mb-2 text-sm font-medium text-foreground">Comprovante</p>
              <a
                href={promissory.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Eye className="h-4 w-4" />
                Ver comprovante
              </a>
            </div>
          )}

          {/* Actions */}
          {userRole === 'debtor' && promissory.status === 'pending' && (
            <div className="space-y-2">
              <Button
                onClick={handleMarkAsPaid}
                className="w-full gradient-primary shadow-button"
              >
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Marcar como Pago
              </Button>
              
              <label className="flex items-center justify-center gap-2 w-full h-10 rounded-lg border-2 border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary cursor-pointer transition-colors">
                <Upload className="h-4 w-4" />
                Anexar comprovante (opcional)
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          )}

          {userRole === 'creditor' && promissory.status === 'paid_by_debtor' && (
            <Button
              onClick={() => onConfirmPayment?.(promissory.id)}
              className="w-full gradient-primary shadow-button"
            >
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Confirmar Recebimento
            </Button>
          )}

          {promissory.status === 'confirmed' && (
            <div className="flex items-center justify-center gap-2 py-2 text-success">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Pagamento Confirmado</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
