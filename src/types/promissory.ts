export interface User {
  id: string;
  name: string;
  role: 'debtor' | 'creditor';
  pixKey?: string;
}

export interface Promissory {
  id: string;
  number: number;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid_by_debtor' | 'confirmed' | 'overdue';
  debtorConfirmedAt?: string;
  creditorConfirmedAt?: string;
  receiptUrl?: string;
  paidAt?: string;
}

export interface Contract {
  id: string;
  debtorName: string;
  debtorCpf: string;
  debtorPhone: string;
  creditorName: string;
  creditorCpf: string;
  creditorPixKey?: string;
  totalAmount: number;
  promissories: Promissory[];
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type: 'payment_marked' | 'payment_confirmed' | 'reminder';
}
