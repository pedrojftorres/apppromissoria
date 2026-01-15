import { User, Contract, Notification } from '@/types/promissory';

const STORAGE_KEYS = {
  USER: 'promissoria_user',
  CONTRACT: 'promissoria_contract',
  NOTIFICATIONS: 'promissoria_notifications',
};

// User Storage
export const saveUser = (user: User): void => {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

export const getUser = (): User | null => {
  const data = localStorage.getItem(STORAGE_KEYS.USER);
  return data ? JSON.parse(data) : null;
};

export const clearUser = (): void => {
  localStorage.removeItem(STORAGE_KEYS.USER);
};

// Contract Storage
export const saveContract = (contract: Contract): void => {
  localStorage.setItem(STORAGE_KEYS.CONTRACT, JSON.stringify(contract));
};

export const getContract = (): Contract | null => {
  const data = localStorage.getItem(STORAGE_KEYS.CONTRACT);
  return data ? JSON.parse(data) : null;
};

// Initialize default contract if not exists
export const initializeContract = (): Contract => {
  const existing = getContract();
  if (existing) return existing;

  const promissories = Array.from({ length: 20 }, (_, i) => {
    const dueDate = new Date(2026, i, 10);
    return {
      id: `prom-${i + 1}`,
      number: i + 1,
      amount: 1000,
      dueDate: dueDate.toISOString(),
      status: 'pending' as const,
    };
  });

  const contract: Contract = {
    id: 'contract-1',
    debtorName: 'Pedro Henrique Torres',
    debtorCpf: '140.220.356-09',
    debtorPhone: '(32) 99970-4888',
    creditorName: 'Lindomar de Almeida Barbosa',
    creditorCpf: '035.023.936-30',
    totalAmount: 20000,
    promissories,
    createdAt: new Date().toISOString(),
  };

  saveContract(contract);
  return contract;
};

// Notifications Storage
export const getNotifications = (): Notification[] => {
  const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
  return data ? JSON.parse(data) : [];
};

export const saveNotifications = (notifications: Notification[]): void => {
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
};

export const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): void => {
  const notifications = getNotifications();
  const newNotification: Notification = {
    ...notification,
    id: `notif-${Date.now()}`,
    createdAt: new Date().toISOString(),
    read: false,
  };
  notifications.unshift(newNotification);
  saveNotifications(notifications);
};

export const markNotificationRead = (id: string): void => {
  const notifications = getNotifications();
  const updated = notifications.map(n => 
    n.id === id ? { ...n, read: true } : n
  );
  saveNotifications(updated);
};
