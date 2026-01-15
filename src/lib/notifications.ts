import { addNotification } from './storage';

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('Este navegador não suporta notificações');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const sendLocalNotification = (title: string, body: string, userId: string, type: 'payment_marked' | 'payment_confirmed' | 'reminder'): void => {
  // Save to storage for in-app display
  addNotification({
    userId,
    title,
    message: body,
    type,
  });

  // Send browser notification if permitted
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: `${type}-${Date.now()}`,
      requireInteraction: true,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }
};

export const notifyPaymentMarked = (promissoryNumber: number, markedBy: 'debtor' | 'creditor'): void => {
  const targetUserId = markedBy === 'debtor' ? 'creditor' : 'debtor';
  const title = markedBy === 'debtor' 
    ? '💰 Pagamento Realizado!' 
    : '✅ Pagamento Confirmado!';
  const body = markedBy === 'debtor'
    ? `A parcela ${promissoryNumber} foi marcada como paga. Por favor, confirme o recebimento.`
    : `O credor confirmou o recebimento da parcela ${promissoryNumber}.`;

  sendLocalNotification(title, body, targetUserId, markedBy === 'debtor' ? 'payment_marked' : 'payment_confirmed');
};

export const notifyPaymentReminder = (promissoryNumber: number, dueDate: string): void => {
  const title = '⏰ Lembrete de Pagamento';
  const body = `A parcela ${promissoryNumber} vence em ${dueDate}. Não esqueça de realizar o pagamento!`;
  
  sendLocalNotification(title, body, 'debtor', 'reminder');
};

// Schedule daily check for reminders
export const scheduleReminders = (): void => {
  // Check every hour
  setInterval(() => {
    checkUpcomingPayments();
  }, 60 * 60 * 1000);
  
  // Also check immediately
  checkUpcomingPayments();
};

const checkUpcomingPayments = (): void => {
  const contractData = localStorage.getItem('promissoria_contract');
  if (!contractData) return;

  const contract = JSON.parse(contractData);
  const today = new Date();
  const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

  contract.promissories.forEach((prom: any) => {
    if (prom.status === 'pending') {
      const dueDate = new Date(prom.dueDate);
      if (dueDate >= today && dueDate <= threeDaysFromNow) {
        const formattedDate = dueDate.toLocaleDateString('pt-BR');
        notifyPaymentReminder(prom.number, formattedDate);
      }
    }
  });
};
