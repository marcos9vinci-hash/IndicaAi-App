import React from 'react';
import AdminDashboard from './AdminDashboard';
import { UserRole, UserTier, BookingStatus, TransactionType } from '../types';

export default function TestCRM() {
  const mockUsers = [
    { uid: '1', name: 'Zorayel', phone: '5511999999999', role: UserRole.USER, tier: UserTier.OURO, creditsBalance: 500, inviteCode: 'ZORA', createdAt: { toDate: () => new Date() }, lastSeenAt: { toDate: () => new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) } },
    { uid: '2', name: 'Axelion', phone: '5511888888888', role: UserRole.USER, tier: UserTier.BRONZE, creditsBalance: 50, inviteCode: 'AXEL', createdAt: { toDate: () => new Date() }, referredBy: '1' },
    { uid: '3', name: 'Inativo 30 dias', phone: '5511777777777', role: UserRole.USER, tier: UserTier.BRONZE, creditsBalance: 0, inviteCode: 'COLD', createdAt: { toDate: () => new Date() }, lastSeenAt: { toDate: () => new Date(Date.now() - 31 * 24 * 60 * 60 * 1000) } }
  ];

  const mockBookings = [
    { id: 'b1', userId: '1', status: BookingStatus.COMPLETED, priceEstimated: 500, depositPaid: 100, date: '2024-04-20', createdAt: { toMillis: () => Date.now() } },
    { id: 'b2', userId: '2', status: BookingStatus.PENDING_APPROVAL, priceEstimated: 300, depositPaid: 0, date: '2024-04-25', createdAt: { toMillis: () => Date.now() } }
  ];

  const mockTransactions = [
    { id: 't1', userId: '1', amount: 50, type: TransactionType.REFERRAL, createdAt: { toDate: () => new Date() } }
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-primary-fixed font-headline text-3xl mb-8 uppercase tracking-widest">Demonstração: Responsividade Desktop</h1>
        <AdminDashboard 
          users={mockUsers as any}
          bookings={mockBookings as any}
          transactions={mockTransactions as any}
          invites={[]}
        />
      </div>
    </div>
  );
}
