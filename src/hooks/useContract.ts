import { useState, useEffect, useCallback } from 'react';
import { Contract, Promissory } from '@/types/promissory';
import { getContract, saveContract, initializeContract } from '@/lib/storage';
import { notifyPaymentMarked } from '@/lib/notifications';

export const useContract = () => {
  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadedContract = initializeContract();
    setContract(loadedContract);
    setIsLoading(false);
  }, []);

  const updatePromissory = useCallback((promissoryId: string, updates: Partial<Promissory>) => {
    if (!contract) return;

    const updatedPromissories = contract.promissories.map(p =>
      p.id === promissoryId ? { ...p, ...updates } : p
    );

    const updatedContract = { ...contract, promissories: updatedPromissories };
    saveContract(updatedContract);
    setContract(updatedContract);
  }, [contract]);

  const markAsPaidByDebtor = useCallback((promissoryId: string, receiptUrl?: string) => {
    const promissory = contract?.promissories.find(p => p.id === promissoryId);
    if (!promissory) return;

    updatePromissory(promissoryId, {
      status: 'paid_by_debtor',
      debtorConfirmedAt: new Date().toISOString(),
      receiptUrl,
      paidAt: new Date().toISOString(),
    });

    notifyPaymentMarked(promissory.number, 'debtor');
  }, [contract, updatePromissory]);

  const confirmPaymentByCreditor = useCallback((promissoryId: string) => {
    const promissory = contract?.promissories.find(p => p.id === promissoryId);
    if (!promissory) return;

    updatePromissory(promissoryId, {
      status: 'confirmed',
      creditorConfirmedAt: new Date().toISOString(),
    });

    notifyPaymentMarked(promissory.number, 'creditor');
  }, [contract, updatePromissory]);

  const updateCreditorPixKey = useCallback((pixKey: string) => {
    if (!contract) return;

    const updatedContract = { ...contract, creditorPixKey: pixKey };
    saveContract(updatedContract);
    setContract(updatedContract);
  }, [contract]);

  const getStats = useCallback(() => {
    if (!contract) return { paid: 0, pending: 0, overdue: 0, total: 0, paidAmount: 0, pendingAmount: 0 };

    const now = new Date();
    let paid = 0;
    let pending = 0;
    let overdue = 0;

    contract.promissories.forEach(p => {
      if (p.status === 'confirmed') {
        paid++;
      } else if (new Date(p.dueDate) < now && p.status === 'pending') {
        overdue++;
      } else {
        pending++;
      }
    });

    return {
      paid,
      pending,
      overdue,
      total: contract.promissories.length,
      paidAmount: paid * 1000,
      pendingAmount: (pending + overdue) * 1000,
    };
  }, [contract]);

  return {
    contract,
    isLoading,
    markAsPaidByDebtor,
    confirmPaymentByCreditor,
    updateCreditorPixKey,
    getStats,
  };
};
