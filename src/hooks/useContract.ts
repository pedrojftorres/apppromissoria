import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sendPushNotification } from '@/lib/pushNotifications';

interface Promissory {
  id: string;
  number: number;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid_by_debtor' | 'confirmed' | 'overdue';
  debtor_confirmed_at: string | null;
  creditor_confirmed_at: string | null;
  receipt_url: string | null;
  paid_at: string | null;
}

export const useContract = () => {
  const [promissories, setPromissories] = useState<Promissory[]>([]);
  const [creditorPixKey, setCreditorPixKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      // Load promissories
      const { data: proms, error: promsError } = await supabase
        .from('promissories')
        .select('*')
        .order('number', { ascending: true });

      if (promsError) throw promsError;
      
      // Cast the status to the correct type
      const typedProms = (proms || []).map(p => ({
        ...p,
        status: p.status as Promissory['status']
      }));
      
      setPromissories(typedProms);

      // Load creditor's PIX key
      const { data: creditor } = await supabase
        .from('users')
        .select('pix_key')
        .eq('role', 'creditor')
        .single();

      setCreditorPixKey(creditor?.pix_key || null);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('promissories-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'promissories' },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  const markAsPaidByDebtor = useCallback(async (promissoryId: string, receiptUrl?: string) => {
    const promissory = promissories.find(p => p.id === promissoryId);
    if (!promissory) return;

    const { error } = await supabase
      .from('promissories')
      .update({
        status: 'paid_by_debtor',
        debtor_confirmed_at: new Date().toISOString(),
        paid_at: new Date().toISOString(),
        receipt_url: receiptUrl || null
      })
      .eq('id', promissoryId);

    if (error) {
      console.error('Error updating promissory:', error);
      return;
    }

    // Get creditor user ID and send notification
    const { data: creditor } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'creditor')
      .single();

    if (creditor) {
      await sendPushNotification(
        creditor.id,
        '💰 Pagamento Realizado!',
        `A parcela ${promissory.number} foi marcada como paga. Confirme o recebimento.`,
        'payment_marked'
      );
    }

    loadData();
  }, [promissories, loadData]);

  const confirmPaymentByCreditor = useCallback(async (promissoryId: string) => {
    const promissory = promissories.find(p => p.id === promissoryId);
    if (!promissory) return;

    const { error } = await supabase
      .from('promissories')
      .update({
        status: 'confirmed',
        creditor_confirmed_at: new Date().toISOString()
      })
      .eq('id', promissoryId);

    if (error) {
      console.error('Error confirming payment:', error);
      return;
    }

    // Get debtor user ID and send notification
    const { data: debtor } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'debtor')
      .single();

    if (debtor) {
      await sendPushNotification(
        debtor.id,
        '✅ Pagamento Confirmado!',
        `O credor confirmou o recebimento da parcela ${promissory.number}.`,
        'payment_confirmed'
      );
    }

    loadData();
  }, [promissories, loadData]);

  const updateCreditorPixKey = useCallback(async (pixKey: string) => {
    const { error } = await supabase
      .from('users')
      .update({ pix_key: pixKey })
      .eq('role', 'creditor');

    if (!error) {
      setCreditorPixKey(pixKey);
    }
  }, []);

  const getStats = useCallback(() => {
    const now = new Date();
    let paid = 0;
    let pending = 0;
    let overdue = 0;

    promissories.forEach(p => {
      if (p.status === 'confirmed') {
        paid++;
      } else if (new Date(p.due_date) < now && p.status === 'pending') {
        overdue++;
      } else {
        pending++;
      }
    });

    return {
      paid,
      pending,
      overdue,
      total: promissories.length,
      paidAmount: paid * 1000,
      pendingAmount: (pending + overdue) * 1000,
    };
  }, [promissories]);

  return {
    promissories,
    creditorPixKey,
    isLoading,
    markAsPaidByDebtor,
    confirmPaymentByCreditor,
    updateCreditorPixKey,
    getStats,
    refresh: loadData,
  };
};
