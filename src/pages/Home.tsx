import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Trophy, UserPlus, Calendar, AlertTriangle, TrendingUp, Gift, Store, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CreditTransaction } from '../types';

export default function Home() {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!authLoading && profile && profile.onboardingCompleted !== true) {
      navigate('/onboarding');
    }
  }, [profile, authLoading, navigate]);

  const [transactions, setTransactions] = React.useState<CreditTransaction[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    if (!profile?.uid) return;

    // Transactions listener
    const qTxs = query(
      collection(db, 'transactions'),
      where('userId', '==', profile.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribeTxs = onSnapshot(qTxs, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CreditTransaction[];
      setTransactions(txs);
    });

    // Unread notifications listener
    const qNotifs = query(
      collection(db, 'notifications'),
      where('userId', '==', profile.uid),
      where('read', '==', false)
    );

    const unsubscribeNotifs = onSnapshot(qNotifs, (snapshot) => {
      setUnreadCount(snapshot.size);
    });

    return () => {
      unsubscribeTxs();
      unsubscribeNotifs();
    };
  }, [profile?.uid]);

  return (
    <div className="bg-background text-on-surface font-sans min-h-screen pb-32">
      <header className="fixed top-0 z-50 w-full flex justify-between items-center px-6 py-4 bg-zinc-950/80 backdrop-blur-xl border-b border-white/10 shadow-[0_0_20px_rgba(204,255,0,0.05)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary-fixed overflow-hidden bg-zinc-800 flex items-center justify-center">
            {profile?.avatar ? (
              <img alt="Profile" className="w-full h-full object-cover" src={profile.avatar} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-primary-fixed font-bold font-headline">
                {profile?.name?.charAt(0) || 'U'}
              </div>
            )}
          </div>
          <span className="text-xl font-black text-white tracking-widest font-headline uppercase">INK VIP</span>
        </div>
        <button 
          onClick={() => navigate('/notifications')}
          className="relative text-primary-fixed hover:bg-white/5 p-2 rounded-full transition-colors"
        >
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full border-2 border-zinc-950 flex items-center justify-center text-[8px] font-black text-white scale-110">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </header>

      <main className="pt-24 px-6 max-w-lg mx-auto space-y-6">
        {/* Balance Card */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-xl p-8 relative overflow-hidden text-center py-10"
        >
          <div className="absolute -right-10 -top-10 w-60 h-60 bg-primary-fixed/5 rounded-full blur-3xl"></div>
          <p className="font-headline text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Saldo Atual</p>
          <h1 className="text-6xl font-black text-primary-fixed neon-text-glow font-headline mb-2 tracking-tighter">
            R$ {profile?.creditsBalance || 0},00
          </h1>
          <p className="text-white/60 text-sm mb-6">Use seus créditos na próxima tattoo</p>
          <div className="flex items-center justify-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-fixed" />
            <span className="text-sm font-bold text-primary-fixed">+R$ 50,00 este mês</span>
          </div>
        </motion.section>

        {/* Quick Actions */}
        <section className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => navigate('/network')}
            className="bg-primary-fixed text-black h-20 rounded-xl font-headline flex flex-col items-center justify-center gap-1 active:scale-95 transition-all shadow-lg shadow-primary-fixed/10"
          >
            <UserPlus className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase tracking-wider">Indicar amigo</span>
          </button>
          <button 
            onClick={() => navigate('/booking')}
            className="bg-zinc-900 border border-white/10 text-primary-fixed h-20 rounded-xl font-headline flex flex-col items-center justify-center gap-1 active:scale-95 transition-all"
          >
            <Calendar className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase tracking-wider">Agendar tattoo</span>
          </button>
        </section>

        {/* Alerts */}
        <section className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-4">
          <div className="bg-red-500/20 p-2 rounded-full">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-red-100">R$120 em créditos expiram em 20 dias</p>
            <p className="text-zinc-500 text-[10px] uppercase tracking-wider font-headline">Use seus pontos antes que eles expirem.</p>
          </div>
        </section>

        {/* Tier Progress */}
        <section className="glass-panel rounded-xl p-6 border-tertiary-fixed/30">
          <div className="flex justify-between items-end mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-5 h-5 text-tertiary-fixed-dim fill-tertiary-fixed-dim" />
                <h2 className="font-headline text-xl text-tertiary-fixed flex items-center justify-between w-full">
                  <span>{profile?.tier || 'Bronze'} Tier</span>
                  <button 
                    onClick={() => navigate('/como-funciona')}
                    className="text-[9px] bg-white/5 px-2 py-1 rounded border border-white/5 text-zinc-400 font-headline uppercase tracking-widest flex items-center gap-1"
                  >
                    Regras
                    <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                </h2>
              </div>
              <p className="text-zinc-500 text-xs">Indique 2 amigos que tatuem para subir de nível</p>
            </div>
            <p className="font-headline text-[10px] text-tertiary-fixed tracking-widest uppercase">850 / 1000 pts</p>
          </div>
          <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden flex items-center p-[2px]">
            <div className="h-full w-[85%] bg-gradient-to-r from-secondary-container to-primary-fixed rounded-full relative">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]"></div>
            </div>
          </div>
          <div className="grid grid-cols-3 mt-6 pt-4 border-t border-white/5">
            <div className="text-center">
              <p className="font-headline text-[10px] text-zinc-500 mb-1 uppercase tracking-widest">Referrals</p>
              <p className="font-headline text-lg text-white">12</p>
            </div>
            <div className="text-center border-x border-white/5">
              <p className="font-headline text-[10px] text-zinc-500 mb-1 uppercase tracking-widest">Rank</p>
              <p className="font-headline text-lg text-white">#04</p>
            </div>
            <div className="text-center">
              <p className="font-headline text-[10px] text-zinc-500 mb-1 uppercase tracking-widest">Benefits</p>
              <p className="font-headline text-lg text-white">03</p>
            </div>
          </div>
        </section>

        {/* Activity */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-headline text-[10px] text-zinc-500 uppercase tracking-widest">Atividade Recente</h4>
            <button className="text-primary-fixed font-headline text-[10px] uppercase tracking-widest">Ver Tudo</button>
          </div>
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="glass-panel p-8 rounded-xl text-center border-dashed border-white/10">
                <p className="text-zinc-500 text-xs uppercase font-headline tracking-widest">Nenhuma transação ainda</p>
              </div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="glass-panel p-4 rounded-xl flex justify-between items-center bg-white/5">
                  <div className="flex items-center gap-4">
                    <div className={`${tx.amount > 0 ? 'bg-primary-fixed/10' : 'bg-red-500/10'} p-2 rounded-full`}>
                      {tx.amount > 0 ? (
                        <Gift className={`w-5 h-5 ${tx.amount > 0 ? 'text-primary-fixed' : 'text-red-400'}`} />
                      ) : (
                        <Store className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white line-clamp-1">{tx.description || 'Transação'}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-headline">
                          {tx.createdAt?.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </p>
                        {tx.expiresAt && (
                          <span className="text-[8px] bg-red-500/10 text-red-400 px-1 rounded border border-red-500/20 font-headline uppercase">
                            Expira em {tx.expiresAt.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className={`font-bold ${tx.amount > 0 ? 'text-primary-fixed' : 'text-white'}`}>
                    {tx.amount > 0 ? '+' : ''} R$ {Math.abs(tx.amount).toFixed(2)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
