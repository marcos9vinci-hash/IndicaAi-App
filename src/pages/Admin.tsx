import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, getDocs, doc, updateDoc, increment, serverTimestamp, addDoc, where, getDoc, setDoc, orderBy } from 'firebase/firestore';
import { UserProfile, TransactionType, OperationType, Booking, NotificationType, UserTier, BookingStatus, StudioSettings, CreditTransaction, InviteCode, StudioRule, Campaign, Artist } from '../types';
import { handleFirestoreError } from '../lib/error-handler';
import { Shield, Users, Calendar, Check, X, PlusCircle, CheckCircle, Settings, Clock, Ban, DollarSign, Edit2, BarChart3, Ticket, ScrollText, Trash2, Save, ToggleLeft, ToggleRight, Plus, Gift } from 'lucide-react';
import { cn } from '../lib/utils';
import AdminDashboard from './AdminDashboard';

export default function Admin() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [invites, setInvites] = useState<InviteCode[]>([]);
  const [rules, setRules] = useState<StudioRule[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'bookings' | 'settings' | 'dashboard' | 'invites' | 'rules' | 'campaigns'>('dashboard');

  // Modals/Selection
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');

  // Rule Edit State
  const [editingRule, setEditingRule] = useState<Partial<StudioRule> | null>(null);
  // Invite Create State
  const [newInvite, setNewInvite] = useState({ code: '', maxUses: 10, expiresAt: '' });
  // Campaign Edit State
  const [editingCampaign, setEditingCampaign] = useState<Partial<Campaign> | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustDesc, setAdjustDesc] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  // Reschedule Modal
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '' });

  // Settings
  const [settings, setSettings] = useState<StudioSettings>({
    workingDays: [1, 2, 3, 4, 5, 6],
    workingHours: { start: '09:00', end: '19:00' },
    blockedDates: [],
    maxSessionsPerDay: 5,
    adminIds: []
  });

  useEffect(() => {
    if (isAdmin) {
      fetchData();
      fetchSettings();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      setUsers(usersSnap.docs.map(d => d.data() as UserProfile));

      const bookingsSnap = await getDocs(collection(db, 'bookings'));
      setBookings(bookingsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Booking)).sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()));

      const txsSnap = await getDocs(collection(db, 'transactions'));
      setTransactions(txsSnap.docs.map(d => ({ id: d.id, ...d.data() } as CreditTransaction)));

      const invitesSnap = await getDocs(collection(db, 'invites'));
      setInvites(invitesSnap.docs.map(d => ({ id: d.id, ...d.data() } as InviteCode)));

      const rulesSnap = await getDocs(query(collection(db, 'studio_rules'), orderBy('order', 'asc')));
      setRules(rulesSnap.docs.map(d => ({ id: d.id, ...d.data() } as StudioRule)));

      const campaignsSnap = await getDocs(collection(db, 'campaigns'));
      setCampaigns(campaignsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Campaign)));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'admin/data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const settingsSnap = await getDoc(doc(db, 'studio_settings', 'main'));
      if (settingsSnap.exists()) {
        setSettings(settingsSnap.data() as StudioSettings);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const handleUpdateSettings = async () => {
    try {
      await setDoc(doc(db, 'studio_settings', 'main'), settings);
      alert('Configurações salvas!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (booking: Booking, nextStatus: BookingStatus, customData: any = {}) => {
    try {
      await updateDoc(doc(db, 'bookings', booking.id), { 
        status: nextStatus,
        ...customData
      });

      let title = '';
      let message = '';

      switch (nextStatus) {
        case BookingStatus.APPROVED:
          title = 'Agendamento Aprovado! ✅';
          message = 'Seu agendamento foi aprovado pelo estúdio.';
          break;
        case BookingStatus.REJECTED:
          title = 'Agendamento Recusado ❌';
          message = 'Infelizmente seu agendamento não pôde ser aceito.';
          break;
        case BookingStatus.RESCHEDULED:
          title = 'Horário Reagendado 🕒';
          message = `Seu horário foi alterado para ${customData.date} às ${customData.time}.`;
          break;
        case BookingStatus.DEPOSIT_PAID:
          title = 'Depósito Confirmado! 💸';
          message = 'Recebemos o pagamento do seu sinal.';
          break;
      }

      if (title) {
        await addDoc(collection(db, 'notifications'), {
          userId: booking.userId,
          type: NotificationType.BOOKING_CONFIRMED,
          title,
          message,
          createdAt: serverTimestamp(),
          read: false
        });
      }

      fetchData();
      setSelectedBooking(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteTattoo = async (booking: Booking) => {
    try {
      // Check for active campaign
      const activeCampaign = campaigns.find(c => {
        if (!c.active) return false;
        const now = new Date();
        const start = c.startDate.toDate ? c.startDate.toDate() : new Date(c.startDate);
        const end = c.endDate.toDate ? c.endDate.toDate() : new Date(c.endDate);
        return now >= start && now <= end;
      });

      const rewardLevels = activeCampaign 
        ? [activeCampaign.bonusLevel1Percent, activeCampaign.bonusLevel2Percent, activeCampaign.bonusLevel3Percent]
        : [100, 50, 25];

      // 1. Update Booking
      await handleStatusChange(booking, BookingStatus.COMPLETED);

      // 2. Add Credits to the user who did the tattoo
      const userBonus = 20;
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

      await updateDoc(doc(db, 'users', booking.userId), {
        creditsBalance: increment(userBonus)
      });

      await addDoc(collection(db, 'transactions'), {
        userId: booking.userId,
        amount: userBonus,
        type: TransactionType.REFERRAL,
        bookingId: booking.id,
        description: 'Bônus por concluir sua tattoo!',
        createdAt: serverTimestamp(),
        expiresAt: sixMonthsFromNow
      });

      // Notify User for Credits
      await addDoc(collection(db, 'notifications'), {
        userId: booking.userId,
        type: NotificationType.CREDIT_RECEIVED,
        title: `Créditos recebidos! 🎉`,
        message: `Você recebeu R$ ${userBonus} em créditos pela sua tattoo.`,
        createdAt: serverTimestamp(),
        read: false
      });

      // 3. Handle 3 levels of referrals
      let currentUserId = booking.userId;

      for (let i = 0; i < 3; i++) {
        const userSnap = await getDocs(query(collection(db, 'users'), where('uid', '==', currentUserId)));
        if (userSnap.empty) break;
        
        const userData = userSnap.docs[0].data() as UserProfile;
        const referrerId = userData.referredBy;

        if (!referrerId) break;

        await updateDoc(doc(db, 'users', referrerId), {
          creditsBalance: increment(rewardLevels[i])
        });

        await addDoc(collection(db, 'transactions'), {
          userId: referrerId,
          amount: rewardLevels[i],
          type: TransactionType.REFERRAL,
          bookingId: booking.id,
          description: `Bônus de indicação Nível ${i + 1}`,
          sourceId: booking.userId,
          createdAt: serverTimestamp(),
          expiresAt: sixMonthsFromNow
        });

        // Notify Referrer
        await addDoc(collection(db, 'notifications'), {
          userId: referrerId,
          type: NotificationType.CREDIT_RECEIVED,
          title: `Bônus de Indicação! 💸`,
          message: `Você recebeu R$ ${rewardLevels[i]} porque um indicado tatuou!`,
          createdAt: serverTimestamp(),
          read: false
        });

        // Rank up logic for referrer (Level 1 only)
        if (i === 0) {
          const qCount = query(collection(db, 'transactions'), where('userId', '==', referrerId), where('type', '==', TransactionType.REFERRAL), where('description', '==', 'Bônus de indicação Nível 1'));
          const countSnap = await getDocs(qCount);
          const referralTattooCount = countSnap.size;

          let newTier: UserTier | null = null;
          if (referralTattooCount >= 10) newTier = UserTier.DIAMANTE;
          else if (referralTattooCount >= 5) newTier = UserTier.OURO;
          else if (referralTattooCount >= 2) newTier = UserTier.PRATA;

          const referrerDoc = await getDoc(doc(db, 'users', referrerId));
          const currentTier = referrerDoc.data()?.tier;

          if (newTier && newTier !== currentTier) {
            await updateDoc(doc(db, 'users', referrerId), { tier: newTier });
            await addDoc(collection(db, 'notifications'), {
              userId: referrerId,
              type: NotificationType.RANK_UP,
              title: 'Você subiu de nível! 🔥',
              message: `Parabéns! Você agora é nível ${newTier}. Aproveite as novas vantagens.`,
              createdAt: serverTimestamp(),
              read: false
            });
          }
        }
        currentUserId = referrerId;
      }
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdjustCredits = async () => {
    if (!selectedUser || !adjustAmount || !adjustDesc) return;
    setAdjusting(true);
    try {
      const amount = parseInt(adjustAmount);
      await updateDoc(doc(db, 'users', selectedUser.uid), {
        creditsBalance: increment(amount)
      });
      await addDoc(collection(db, 'transactions'), {
        userId: selectedUser.uid,
        amount: amount,
        type: TransactionType.ADMIN_ADJUSTMENT,
        description: `Ajuste Admin: ${adjustDesc}`,
        createdAt: serverTimestamp()
      });
      await addDoc(collection(db, 'notifications'), {
        userId: selectedUser.uid,
        type: NotificationType.CREDIT_RECEIVED,
        title: amount > 0 ? 'Créditos recebidos! 🎉' : 'Ajuste de créditos',
        message: amount > 0 ? `Você recebeu R$ ${amount} em créditos.` : `Seu saldo foi ajustado em R$ ${Math.abs(amount)}.`,
        createdAt: serverTimestamp(),
        read: false
      });
      setSelectedUser(null);
      setAdjustAmount('');
      setAdjustDesc('');
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setAdjusting(false);
    }
  };

  const handleUpdateRule = async (rule: Partial<StudioRule>) => {
    try {
      if (rule.id) {
        await updateDoc(doc(db, 'studio_rules', rule.id), rule as any);
      } else {
        await addDoc(collection(db, 'studio_rules'), {
          ...rule,
          active: true,
          order: rules.length + 1
        });
      }
      setEditingRule(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateInvite = async () => {
    if (!newInvite.code) return;
    try {
      await setDoc(doc(db, 'invites', newInvite.code.trim()), {
        code: newInvite.code.trim(),
        createdAt: serverTimestamp(),
        expiresAt: newInvite.expiresAt ? new Date(newInvite.expiresAt) : null,
        maxUses: newInvite.maxUses,
        usesCount: 0,
        createdByAdmin: true,
        active: true
      });
      setNewInvite({ code: '', maxUses: 10, expiresAt: '' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleInvite = async (invite: InviteCode) => {
    await updateDoc(doc(db, 'invites', invite.id), { active: !invite.active });
    fetchData();
  };

  const handleUpdateCampaign = async (campaign: Partial<Campaign>) => {
    try {
      if (campaign.id) {
        await updateDoc(doc(db, 'campaigns', campaign.id), campaign as any);
      } else {
        await addDoc(collection(db, 'campaigns'), {
          ...campaign,
          active: true,
          createdAt: serverTimestamp()
        });
      }
      setEditingCampaign(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleCampaign = async (campaign: Campaign) => {
    await updateDoc(doc(db, 'campaigns', campaign.id), { active: !campaign.active });
    fetchData();
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.PENDING_APPROVAL: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20';
      case BookingStatus.APPROVED: return 'bg-blue-500/20 text-blue-400 border-blue-500/20';
      case BookingStatus.REJECTED: return 'bg-red-500/20 text-red-500 border-red-500/20';
      case BookingStatus.DEPOSIT_PAID: return 'bg-green-500/20 text-green-400 border-green-500/20';
      case BookingStatus.COMPLETED: return 'bg-primary-fixed/20 text-primary-fixed border-primary-fixed/20';
      case BookingStatus.NO_SHOW: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/20';
      default: return 'bg-zinc-800 text-zinc-500';
    }
  };

  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center bg-background text-primary">Acesso Negado</div>;

  return (
    <div className="bg-background text-on-surface font-sans min-h-screen pb-32">
      <header className="bg-zinc-950/80 backdrop-blur-xl border-b border-primary-fixed/20 sticky top-0 z-50 flex items-center justify-between px-6 h-16 w-full">
        <div className="flex items-center gap-3">
          <Shield className="text-primary-fixed w-6 h-6" />
          <h1 className="font-headline text-xl font-black text-primary-fixed uppercase tracking-widest leading-none">Studio Operation</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
          {[
            { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
            { id: 'bookings', icon: Calendar, label: 'Agenda' },
            { id: 'users', icon: Users, label: 'Membros' },
            { id: 'invites', icon: Ticket, label: 'Convites' },
            { id: 'campaigns', icon: Gift, label: 'Campanhas' },
            { id: 'rules', icon: ScrollText, label: 'Regras' },
            { id: 'settings', icon: Settings, label: 'Config' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-none px-6 py-3 rounded-xl font-headline text-[10px] tracking-widest uppercase font-black transition-all border",
                activeTab === tab.id ? "bg-primary-fixed text-black border-primary-fixed shadow-lg" : "text-zinc-600 hover:text-zinc-300 border-white/5 bg-zinc-900"
              )}
            >
              <tab.icon className="w-3.5 h-3.5 inline mr-1.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-zinc-500 font-headline uppercase tracking-widest animate-pulse">Carregando painel...</div>
        ) : (
          <div className="space-y-4">
            {activeTab === 'dashboard' && (
              <AdminDashboard 
                users={users} 
                bookings={bookings} 
                transactions={transactions} 
              />
            )}

            {activeTab === 'invites' && (
              <div className="space-y-6">
                 <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
                    <h3 className="font-headline text-sm uppercase tracking-widest text-primary-fixed">Novo Convite Administrativo</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <input 
                         type="text" 
                         placeholder="CÓDIGO (ex: VIP2024)" 
                         className="bg-black/50 border border-white/10 rounded-xl p-4 text-sm font-headline uppercase"
                         value={newInvite.code}
                         onChange={e => setNewInvite({...newInvite, code: e.target.value.toUpperCase()})}
                       />
                       <input 
                         type="number" 
                         placeholder="LIMITE USOS" 
                         className="bg-black/50 border border-white/10 rounded-xl p-4 text-sm font-headline"
                         value={newInvite.maxUses}
                         onChange={e => setNewInvite({...newInvite, maxUses: parseInt(e.target.value)})}
                       />
                       <button 
                        onClick={handleCreateInvite}
                        className="bg-primary-fixed text-black rounded-xl font-headline font-black uppercase tracking-widest text-[10px]"
                       >
                         Gerar Convite
                       </button>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {invites.map(invite => (
                      <div key={invite.id} className="glass-panel p-5 rounded-2xl border border-white/5 flex justify-between items-center group">
                        <div className="space-y-1">
                           <div className="flex items-center gap-2">
                             <p className="font-headline text-lg text-white font-black">{invite.code}</p>
                             {!invite.active && <span className="text-[8px] bg-red-400 text-black px-1.5 rounded font-black uppercase">Inativo</span>}
                           </div>
                           <p className="text-[10px] text-zinc-500 font-headline uppercase tracking-widest">
                             {invite.usesCount} / {invite.maxUses} usos
                           </p>
                        </div>
                        <button onClick={() => toggleInvite(invite)} className="text-zinc-600 hover:text-primary-fixed transition-colors">
                           {invite.active ? <ToggleRight className="w-8 h-8 text-primary-fixed" /> : <ToggleLeft className="w-8 h-8" />}
                        </button>
                      </div>
                    ))}
                 </div>
              </div>
            )}

            {activeTab === 'campaigns' && (
              <div className="space-y-6">
                 <div className="flex justify-between items-center">
                    <h3 className="font-headline text-sm uppercase tracking-widest text-primary-fixed">Campanhas de Bônus</h3>
                    <button 
                      onClick={() => setEditingCampaign({ title: '', description: '', bonusLevel1Percent: 100, bonusLevel2Percent: 50, bonusLevel3Percent: 25, startDate: '', endDate: '' })}
                      className="bg-white/5 border border-white/10 p-2 rounded-lg text-white hover:bg-white/10"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                 </div>

                 <div className="space-y-4">
                    {editingCampaign && (
                       <div className="glass-panel p-6 rounded-2xl border border-primary-fixed/30 space-y-4 animate-in zoom-in-95">
                          <input 
                            placeholder="Nome da Campanha"
                            className="w-full bg-black/50 border border-white/10 rounded-xl p-4 font-headline uppercase tracking-widest text-xs"
                            value={editingCampaign.title}
                            onChange={e => setEditingCampaign({...editingCampaign, title: e.target.value})}
                          />
                          <div className="grid grid-cols-3 gap-4">
                             <div>
                                <label className="text-[8px] uppercase text-zinc-500 font-headline mb-1 block">Nível 1 (R$)</label>
                                <input type="number" className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs" value={editingCampaign.bonusLevel1Percent} onChange={e => setEditingCampaign({...editingCampaign, bonusLevel1Percent: parseInt(e.target.value)})} />
                             </div>
                             <div>
                                <label className="text-[8px] uppercase text-zinc-500 font-headline mb-1 block">Nível 2 (R$)</label>
                                <input type="number" className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs" value={editingCampaign.bonusLevel2Percent} onChange={e => setEditingCampaign({...editingCampaign, bonusLevel2Percent: parseInt(e.target.value)})} />
                             </div>
                             <div>
                                <label className="text-[8px] uppercase text-zinc-500 font-headline mb-1 block">Nível 3 (R$)</label>
                                <input type="number" className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs" value={editingCampaign.bonusLevel3Percent} onChange={e => setEditingCampaign({...editingCampaign, bonusLevel3Percent: parseInt(e.target.value)})} />
                             </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="text-[8px] uppercase text-zinc-500 font-headline mb-1 block">Data Início</label>
                                <input type="date" className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs" value={editingCampaign.startDate} onChange={e => setEditingCampaign({...editingCampaign, startDate: e.target.value})} />
                             </div>
                             <div>
                                <label className="text-[8px] uppercase text-zinc-500 font-headline mb-1 block">Data Fim</label>
                                <input type="date" className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs" value={editingCampaign.endDate} onChange={e => setEditingCampaign({...editingCampaign, endDate: e.target.value})} />
                             </div>
                          </div>
                          <div className="flex gap-4">
                             <button onClick={() => setEditingCampaign(null)} className="flex-1 p-3 rounded-xl border border-white/10 text-zinc-500 font-headline uppercase text-[10px] tracking-widest">Cancelar</button>
                             <button onClick={() => handleUpdateCampaign(editingCampaign)} className="flex-1 p-3 rounded-xl bg-primary-fixed text-black font-headline font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary-fixed/20">Ativar Campanha</button>
                          </div>
                       </div>
                    )}

                    {campaigns.map(campaign => (
                      <div key={campaign.id} className="glass-panel p-6 rounded-2xl border border-white/5 flex justify-between items-center group">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <h4 className="font-headline text-sm text-white uppercase tracking-widest">{campaign.title}</h4>
                             {campaign.active && <span className="text-[8px] bg-primary-fixed text-black px-1.5 rounded font-black uppercase">Ativa</span>}
                          </div>
                          <p className="text-[10px] text-zinc-500 font-headline uppercase tracking-widest">
                            Config: {campaign.bonusLevel1Percent}/{campaign.bonusLevel2Percent}/{campaign.bonusLevel3Percent}
                          </p>
                        </div>
                        <button onClick={() => toggleCampaign(campaign)} className="text-zinc-600 hover:text-primary-fixed transition-colors">
                           {campaign.active ? <ToggleRight className="w-8 h-8 text-primary-fixed" /> : <ToggleLeft className="w-8 h-8" />}
                        </button>
                      </div>
                    ))}
                 </div>
              </div>
            )}

            {activeTab === 'rules' && (
              <div className="space-y-6">
                 <div className="flex justify-between items-center">
                    <h3 className="font-headline text-sm uppercase tracking-widest text-primary-fixed">Regras do Membership</h3>
                    <button 
                      onClick={() => setEditingRule({ title: '', content: '', order: rules.length + 1 })}
                      className="bg-white/5 border border-white/10 p-2 rounded-lg text-white hover:bg-white/10"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                 </div>

                 <div className="space-y-4">
                    {editingRule && (
                       <div className="glass-panel p-6 rounded-2xl border border-primary-fixed/30 space-y-4 animate-in zoom-in-95">
                          <input 
                            placeholder="Título da Regra"
                            className="w-full bg-black/50 border border-white/10 rounded-xl p-4 font-headline uppercase tracking-widest text-xs"
                            value={editingRule.title}
                            onChange={e => setEditingRule({...editingRule, title: e.target.value})}
                          />
                          <textarea 
                            placeholder="Conteúdo da política..."
                            className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-sm min-h-[100px]"
                            value={editingRule.content}
                            onChange={e => setEditingRule({...editingRule, content: e.target.value})}
                          />
                          <div className="flex gap-4">
                             <button 
                              onClick={() => setEditingRule(null)}
                              className="flex-1 p-3 rounded-xl border border-white/10 text-zinc-500 font-headline uppercase text-[10px] tracking-widest"
                             >
                               Cancelar
                             </button>
                             <button 
                              onClick={() => handleUpdateRule(editingRule)}
                              className="flex-1 p-3 rounded-xl bg-primary-fixed text-black font-headline font-black uppercase text-[10px] tracking-widest"
                             >
                               Salvar Regra
                             </button>
                          </div>
                       </div>
                    )}

                    {rules.map(rule => (
                      <div key={rule.id} className="glass-panel p-6 rounded-2xl border border-white/5 group relative">
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => setEditingRule(rule)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg"><Edit2 className="w-4 h-4 text-zinc-400" /></button>
                        </div>
                        <div className="flex items-start gap-4">
                           <span className="font-headline text-2xl text-zinc-800 font-black">{rule.order}</span>
                           <div className="space-y-1">
                             <h4 className="font-headline text-sm text-white uppercase tracking-widest">{rule.title}</h4>
                             <p className="text-sm text-zinc-500 leading-relaxed">{rule.content}</p>
                           </div>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            )}
            {activeTab === 'bookings' && (
              bookings.map(b => (
                <div key={b.id} className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-headline text-sm font-black text-white uppercase tracking-wider">Tattoo {b.size}</h3>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {b.date} • {b.time}
                      </p>
                    </div>
                    <span className={cn(
                      "text-[9px] font-headline uppercase tracking-tighter px-2.5 py-1 rounded-full border font-black",
                      getStatusColor(b.status)
                    )}>
                      {b.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-[10px] uppercase font-headline tracking-widest font-black">
                     <div className="bg-white/[0.03] p-3 rounded-xl border border-white/5">
                        <p className="text-zinc-600 mb-1">Estimado</p>
                        <p className="text-white">R$ {b.priceEstimated}</p>
                     </div>
                     <div className="bg-white/[0.03] p-3 rounded-xl border border-white/5">
                        <p className="text-zinc-600 mb-1">Sinal Pago</p>
                        <p className={b.depositPaid > 0 ? "text-primary-fixed" : "text-red-400"}>R$ {b.depositPaid}</p>
                     </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                    {b.status === BookingStatus.PENDING_APPROVAL && (
                      <>
                        <button 
                          onClick={() => handleStatusChange(b, BookingStatus.APPROVED)}
                          className="flex-1 bg-blue-600/20 text-blue-400 text-[10px] font-headline uppercase tracking-widest py-2 rounded-lg border border-blue-600/30 hover:bg-blue-600/30 font-black"
                        >
                          Aprovar
                        </button>
                        <button 
                          onClick={() => handleStatusChange(b, BookingStatus.REJECTED)}
                          className="flex-1 bg-red-600/20 text-red-400 text-[10px] font-headline uppercase tracking-widest py-2 rounded-lg border border-red-600/30 hover:bg-red-600/30 font-black"
                        >
                          Recusar
                        </button>
                      </>
                    )}

                    {b.status === BookingStatus.APPROVED && (
                      <button 
                        onClick={() => handleStatusChange(b, BookingStatus.DEPOSIT_PAID, { depositPaid: 80 })}
                        className="flex-1 bg-primary-fixed/20 text-primary-fixed text-[10px] font-headline uppercase tracking-widest py-2 rounded-lg border border-primary-fixed/30 hover:bg-primary-fixed/30 font-black"
                      >
                        Confirmar Sinal (R$80)
                      </button>
                    )}

                    {(b.status === BookingStatus.DEPOSIT_PAID || b.status === BookingStatus.RESCHEDULED) && (
                      <button 
                        onClick={() => handleCompleteTattoo(b)}
                        className="flex-1 bg-primary-fixed text-black text-[10px] font-headline uppercase tracking-widest py-2 rounded-lg hover:opacity-90 font-black"
                      >
                        Concluir Tattoo
                      </button>
                    )}

                    {b.status !== BookingStatus.COMPLETED && b.status !== BookingStatus.REJECTED && (
                      <div className="flex gap-2 w-full mt-2">
                        <button 
                          onClick={() => setSelectedBooking(b)}
                          className="flex-1 bg-zinc-800 text-zinc-400 text-[10px] font-headline uppercase tracking-widest py-2 rounded-lg hover:bg-zinc-700"
                        >
                          Reagendar
                        </button>
                        <button 
                          onClick={() => handleStatusChange(b, BookingStatus.NO_SHOW)}
                          className="px-4 bg-zinc-800 text-red-400 text-[10px] font-headline uppercase tracking-widest py-2 rounded-lg hover:bg-zinc-700"
                        >
                          No-Show
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {activeTab === 'users' && (
              users.map(u => (
                <div key={u.uid} className="glass-panel p-4 rounded-xl flex items-center justify-between border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-primary-fixed font-headline">
                      {u.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-white">{u.name}</p>
                      <p className="text-xs text-zinc-500">{u.phone} | {u.tier}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-primary-fixed font-headline font-black">R$ {u.creditsBalance}</p>
                    <button 
                      onClick={() => setSelectedUser(u)}
                      className="text-zinc-600 hover:text-white transition-colors"
                    >
                       <PlusCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}

            {activeTab === 'settings' && (
              <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-8">
                <div>
                  <h3 className="font-headline text-lg text-white mb-4 uppercase flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary-fixed" />
                    Configurar Agenda
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] uppercase font-headline text-zinc-500 block mb-3 tracking-widest">Dias da Semana</label>
                      <div className="flex flex-wrap gap-2">
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, idx) => (
                          <button
                            key={day}
                            onClick={() => {
                              const newDays = settings.workingDays.includes(idx)
                                ? settings.workingDays.filter(d => d !== idx)
                                : [...settings.workingDays, idx];
                              setSettings({...settings, workingDays: newDays});
                            }}
                            className={cn(
                              "w-10 h-10 rounded-lg font-headline text-[10px] uppercase transition-all flex items-center justify-center border",
                              settings.workingDays.includes(idx) ? "bg-primary-fixed text-black border-primary-fixed" : "bg-black text-zinc-500 border-white/5"
                            )}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-headline text-zinc-500 block mb-2 tracking-widest">Início</label>
                        <input 
                          type="time" 
                          value={settings.workingHours.start}
                          onChange={(e) => setSettings({...settings, workingHours: {...settings.workingHours, start: e.target.value}})}
                          className="w-full bg-black border border-white/5 rounded-xl h-12 px-4 text-white font-headline"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-headline text-zinc-500 block mb-2 tracking-widest">Fim</label>
                        <input 
                          type="time" 
                          value={settings.workingHours.end}
                          onChange={(e) => setSettings({...settings, workingHours: {...settings.workingHours, end: e.target.value}})}
                          className="w-full bg-black border border-white/5 rounded-xl h-12 px-4 text-white font-headline"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-headline text-zinc-500 block mb-2 tracking-widest">Sessões por dia</label>
                      <input 
                        type="number" 
                        value={settings.maxSessionsPerDay}
                        onChange={(e) => setSettings({...settings, maxSessionsPerDay: parseInt(e.target.value)})}
                        className="w-full bg-black border border-white/5 rounded-xl h-12 px-4 text-white font-headline"
                      />
                    </div>

                    <button 
                      onClick={handleUpdateSettings}
                      className="w-full bg-primary-fixed text-black h-14 rounded-xl font-headline font-black uppercase tracking-widest shadow-lg shadow-primary-fixed/20 hover:scale-[0.99] transition-all"
                    >
                      Salvar Agenda
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reschedule Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedBooking(null)}></div>
            <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl w-full max-w-sm relative z-10">
               <h3 className="font-headline text-lg text-white mb-4 uppercase">Reagendar Tattoo</h3>
               <div className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase font-headline text-zinc-500 block mb-1">Nova Data</label>
                    <input 
                      type="date" 
                      onChange={(e) => setRescheduleData({...rescheduleData, date: e.target.value})}
                      className="w-full bg-black border border-white/10 rounded-lg h-12 px-4 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-headline text-zinc-500 block mb-1">Novo Horário</label>
                    <input 
                      type="time" 
                      onChange={(e) => setRescheduleData({...rescheduleData, time: e.target.value})}
                      className="w-full bg-black border border-white/10 rounded-lg h-12 px-4 text-white"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                     <button onClick={() => setSelectedBooking(null)} className="flex-1 py-3 bg-zinc-800 text-white rounded-lg font-headline text-[10px] uppercase">Cancelar</button>
                     <button 
                       onClick={() => handleStatusChange(selectedBooking, BookingStatus.RESCHEDULED, rescheduleData)}
                       className="flex-1 py-3 bg-primary-fixed text-black rounded-lg font-headline text-[10px] uppercase font-black"
                     >
                       Confirmar
                     </button>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* Adjust Credits Modal */}
        {selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedUser(null)}></div>
            <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl w-full max-w-sm relative z-10 shadow-2xl">
               <h3 className="font-headline text-lg text-white mb-4 uppercase">Ajustar Créditos: {selectedUser.name}</h3>
               <div className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase font-headline text-zinc-500 block mb-1">Valor (positivo ou negativo)</label>
                    <input 
                      type="number" 
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(e.target.value)}
                      placeholder="Ex: 50 ou -50"
                      className="w-full bg-black border border-white/10 rounded-lg h-12 px-4 text-white font-headline"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-headline text-zinc-500 block mb-1">Motivo do Ajuste</label>
                    <textarea 
                      value={adjustDesc}
                      onChange={(e) => setAdjustDesc(e.target.value)}
                      placeholder="Descreva o motivo..."
                      className="w-full bg-black border border-white/10 rounded-lg p-4 text-white text-sm h-24"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                     <button 
                       onClick={() => setSelectedUser(null)}
                       className="flex-1 h-12 rounded-lg bg-zinc-800 text-white font-headline text-xs uppercase"
                     >
                       Cancelar
                     </button>
                     <button 
                       onClick={handleAdjustCredits}
                       disabled={adjusting || !adjustAmount || !adjustDesc}
                       className="flex-1 h-12 rounded-lg bg-primary-fixed text-black font-headline text-xs uppercase font-black disabled:opacity-50"
                     >
                       {adjusting ? "Salvando..." : "Confirmar"}
                     </button>
                  </div>
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
