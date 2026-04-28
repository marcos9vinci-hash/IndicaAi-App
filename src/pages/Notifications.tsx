import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  ChevronLeft, 
  Gift, 
  Star, 
  Users, 
  Calendar, 
  Shield, 
  CheckCircle2, 
  Clock,
  Trash2
} from 'lucide-react';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  writeBatch,
  deleteDoc
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { AppNotification, NotificationType } from '../types';
import { cn } from '../lib/utils';

export default function Notifications() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.uid) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', profile.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AppNotification[];
      setNotifications(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile?.uid]);

  const markAllAsRead = async () => {
    if (!profile?.uid || notifications.length === 0) return;
    
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;

    const batch = writeBatch(db);
    unread.forEach(n => {
      const ref = doc(db, 'notifications', n.id);
      batch.update(ref, { read: true });
    });

    await batch.commit();
  };

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  };

  const deleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteDoc(doc(db, 'notifications', id));
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.CREDIT_RECEIVED: return <Gift className="w-5 h-5 text-primary-fixed" />;
      case NotificationType.NEW_REFERRAL: return <Users className="w-5 h-5 text-secondary-container" />;
      case NotificationType.RANK_UP: return <Star className="w-5 h-5 text-yellow-400" />;
      case NotificationType.BOOKING_CONFIRMED: return <Calendar className="w-5 h-5 text-blue-400" />;
      case NotificationType.EXPIRATION_ALERT: return <Clock className="w-5 h-5 text-red-400" />;
      default: return <Bell className="w-5 h-5 text-zinc-500" />;
    }
  };

  return (
    <div className="bg-background text-on-surface font-sans min-h-screen pb-32">
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-20 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="font-headline text-xl font-black text-white uppercase tracking-widest leading-none">Notificações</h1>
        </div>
        {notifications.some(n => !n.read) && (
          <button 
            onClick={markAllAsRead}
            className="text-[10px] font-headline font-black uppercase tracking-widest text-primary-fixed"
          >
            Lidas
          </button>
        )}
      </header>

      <main className="pt-24 px-6 max-w-md mx-auto">
        {loading ? (
          <div className="py-20 text-center animate-pulse">
            <Bell className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-500 font-headline uppercase text-[10px] tracking-widest">Carregando...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-32 text-center">
            <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
              <Bell className="w-8 h-8 text-zinc-700" />
            </div>
            <h2 className="font-headline text-xl text-white uppercase tracking-wider">Silêncio por aqui</h2>
            <p className="text-zinc-500 text-sm mt-2 font-sans">Você não tem nenhuma notificação no momento.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {notifications.map((notif, idx) => (
                <motion.div 
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => markAsRead(notif.id)}
                  className={cn(
                    "relative glass-panel p-5 rounded-2xl border transition-all active:scale-[0.98]",
                    notif.read ? "border-white/5 bg-white/[0.02]" : "border-primary-fixed/30 bg-primary-fixed/[0.03] shadow-[0_0_15px_rgba(204,255,0,0.03)]"
                  )}
                >
                  {!notif.read && (
                    <div className="absolute top-5 right-5 w-2 h-2 bg-primary-fixed rounded-full shadow-[0_0_10px_#ccff00]"></div>
                  )}
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center shadow-inner">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className={cn(
                          "font-headline text-xs uppercase tracking-wider",
                          notif.read ? "text-zinc-400" : "text-white"
                        )}>
                          {notif.title}
                        </h3>
                        <span className="text-[9px] text-zinc-600 font-headline uppercase">
                          {notif.createdAt?.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      <p className={cn(
                        "text-sm font-sans leading-relaxed",
                        notif.read ? "text-zinc-500" : "text-zinc-300"
                      )}>
                        {notif.message}
                      </p>
                      <div className="flex justify-end mt-3">
                         <button 
                           onClick={(e) => deleteNotification(e, notif.id)}
                           className="p-1.5 text-zinc-700 hover:text-red-400 transition-colors"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
