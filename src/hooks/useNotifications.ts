import { useState, useEffect, useCallback } from 'react';
import { Notification } from '@/types/promissory';
import { getNotifications, markNotificationRead, saveNotifications } from '@/lib/storage';

export const useNotifications = (userId?: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadNotifications = useCallback(() => {
    const all = getNotifications();
    const filtered = userId ? all.filter(n => n.userId === userId) : all;
    setNotifications(filtered);
  }, [userId]);

  useEffect(() => {
    loadNotifications();
    
    // Poll for new notifications every 5 seconds
    const interval = setInterval(loadNotifications, 5000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const markAsRead = useCallback((id: string) => {
    markNotificationRead(id);
    loadNotifications();
  }, [loadNotifications]);

  const clearAll = useCallback(() => {
    const all = getNotifications();
    const filtered = userId ? all.filter(n => n.userId !== userId) : [];
    saveNotifications(filtered);
    loadNotifications();
  }, [userId, loadNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    clearAll,
    refresh: loadNotifications,
  };
};
