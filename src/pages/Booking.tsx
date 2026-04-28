import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, Clock, CheckCircle2, ChevronRight, Menu, Info, Radio, Zap, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc, increment, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { TransactionType, BookingStatus, OperationType, StudioSettings, NotificationType } from '../types';
import { handleFirestoreError } from '../lib/error-handler';

type Size = 'Pequena' | 'Média' | 'Grande';

export default function Booking() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [size, setSize] = useState<Size>('Média');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<StudioSettings | null>(null);
  const [bookingsOnDay, setBookingsOnDay] = useState(0);

  useEffect(() => {
    const fetchSettings = async () => {
      const snap = await getDoc(doc(db, 'studio_settings', 'main'));
      if (snap.exists()) {
        setSettings(snap.data() as StudioSettings);
      } else {
        // Fallback defaults
        setSettings({
          workingDays: [1, 2, 3, 4, 5, 6],
          workingHours: { start: '09:00', end: '19:00' },
          blockedDates: [],
          maxSessionsPerDay: 5,
          adminIds: []
        });
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      const fetchBookingsOnDay = async () => {
        const dateStr = selectedDate.toISOString().split('T')[0];
        const q = query(collection(db, 'bookings'), where('date', '==', dateStr));
        const snap = await getDocs(q);
        setBookingsOnDay(snap.size);
      };
      fetchBookingsOnDay();
    }
  }, [selectedDate]);

  const priceEstimates = {
    'Pequena': { min: 100, max: 300 },
    'Média': { min: 300, max: 700 },
    'Grande': { min: 700, max: 1500 }
  };

  const estimatedValue = size === 'Pequena' ? 200 : size === 'Média' ? 500 : 1000;
  const creditsAvailable = profile?.creditsBalance || 0;
  const maxCreditUsage = Math.min(creditsAvailable, estimatedValue * 0.5); // Max 50% discount
  const depositValue = 80;

  const handleConfirm = async () => {
    if (!profile || !selectedDate || !selectedTime) return;
    setLoading(true);
    
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];

      // 1. Create Booking
      const bookingRef = await addDoc(collection(db, 'bookings'), {
        userId: profile.uid,
        userName: profile.name,
        artistId: null, // Ready for multi-artist
        size,
        date: dateStr,
        time: selectedTime,
        status: BookingStatus.PENDING_APPROVAL,
        priceEstimated: estimatedValue,
        depositPaid: 0,
        creditsUsed: maxCreditUsage,
        createdAt: serverTimestamp()
      });

      // 2. If credits used, deduct and log
      if (maxCreditUsage > 0) {
        await updateDoc(doc(db, 'users', profile.uid), {
          creditsBalance: increment(-maxCreditUsage)
        });

        await addDoc(collection(db, 'transactions'), {
          userId: profile.uid,
          amount: -maxCreditUsage,
          type: TransactionType.BOOKING_DISCOUNT,
          description: `Desconto em Agendamento (${size})`,
          createdAt: serverTimestamp()
        });
      }

      // 3. Notify Admin(s)
      const adminsSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin')));
      for (const adminDoc of adminsSnap.docs) {
        await addDoc(collection(db, 'notifications'), {
          userId: adminDoc.id,
          type: NotificationType.SYSTEM,
          title: 'Novo agendamento! 📅',
          message: `${profile.name} solicitou uma tattoo (${size}) para ${dateStr}.`,
          createdAt: serverTimestamp(),
          read: false
        });
      }

      await refreshProfile();
      navigate('/');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'bookings');
    } finally {
      setLoading(false);
    }
  };

  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const generateTimes = () => {
    if (!settings) return [];
    const times = [];
    let current = parseInt(settings.workingHours.start.split(':')[0]);
    const end = parseInt(settings.workingHours.end.split(':')[0]);
    while (current < end) {
      times.push(`${current.toString().padStart(2, '0')}:00`);
      times.push(`${current.toString().padStart(2, '0')}:30`);
      current++;
    }
    return times;
  };

  const isDayAvailable = (date: Date) => {
    if (!settings) return false;
    const dayOfWeek = date.getDay();
    const dateStr = date.toISOString().split('T')[0];
    return settings.workingDays.includes(dayOfWeek) && !settings.blockedDates.includes(dateStr);
  };

  return (
    <div className="bg-background text-on-surface font-sans min-h-screen pb-32">
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-20 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-4">
          <ChevronRight className="w-6 h-6 text-primary-fixed rotate-180" onClick={() => navigate(-1)} />
          <h1 className="text-primary-fixed font-headline font-black tracking-widest text-xl uppercase">Agendar</h1>
        </div>
      </header>

      <main className="pt-24 px-6 max-w-lg mx-auto space-y-10">
        {/* Step 1: Size */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-headline text-[10px] text-primary-fixed px-2 py-1 bg-primary-fixed/10 rounded tracking-widest border border-primary-fixed/20 uppercase">Passo 1</span>
            <h3 className="font-headline text-xl">Escolha o tamanho</h3>
          </div>
          <div className="space-y-3">
            {(Object.keys(priceEstimates) as Size[]).map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={cn(
                  "w-full glass-panel p-5 rounded-xl flex justify-between items-center transition-all duration-300 border-white/5",
                  size === s && "border-primary-fixed/40 bg-primary-fixed/5 neon-glow"
                )}
              >
                <div className="text-left">
                  <p className={cn("font-headline text-lg", size === s ? "text-primary-fixed" : "text-white")}>{s}</p>
                  <p className={cn("text-sm", size === s ? "text-primary-fixed/70" : "text-on-surface-variant")}>
                    R${priceEstimates[s].min} – R${priceEstimates[s].max}
                  </p>
                </div>
                {size === s ? (
                  <CheckCircle2 className="text-primary-fixed w-6 h-6 fill-primary-fixed/10" />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-zinc-800" />
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Step 2: Date */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-headline text-[10px] text-primary-fixed px-2 py-1 bg-primary-fixed/10 rounded tracking-widest border border-primary-fixed/20 uppercase">Passo 2</span>
            <h3 className="font-headline text-xl">Escolher data</h3>
          </div>
          <div className="glass-panel p-6 rounded-xl border-white/5">
            <div className="grid grid-cols-7 gap-2">
              {generateDates().map((d) => {
                const available = isDayAvailable(d);
                const isSelected = selectedDate?.toDateString() === d.toDateString();
                return (
                  <button
                    key={d.toISOString()}
                    disabled={!available}
                    onClick={() => setSelectedDate(d)}
                    className={cn(
                      "p-2 rounded-xl transition-all h-12 w-full flex flex-col items-center justify-center border",
                      isSelected 
                        ? "bg-primary-fixed text-black font-black border-primary-fixed shadow-lg shadow-primary-fixed/20" 
                        : !available ? "opacity-20 grayscale cursor-not-allowed border-transparent" : "text-white/80 hover:bg-white/5 border-white/5"
                    )}
                  >
                    <span className="text-[8px] font-headline uppercase leading-none mb-1 opacity-60">
                      {d.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3)}
                    </span>
                    <span className="text-xs font-headline font-black">{d.getDate()}</span>
                  </button>
                );
              })}
            </div>
            {selectedDate && settings && bookingsOnDay >= settings.maxSessionsPerDay && (
              <div className="mt-4 flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="text-[10px] font-headline uppercase tracking-widest font-black leading-none">Agenda lotada para este dia!</p>
              </div>
            )}
          </div>
        </section>

        {/* Step 3: Time */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-headline text-[10px] text-primary-fixed px-2 py-1 bg-primary-fixed/10 rounded tracking-widest border border-primary-fixed/20 uppercase">Passo 3</span>
            <h3 className="font-headline text-xl">Escolher horário</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {generateTimes().map((t) => (
              <button
                key={t}
                disabled={!selectedDate || (settings && bookingsOnDay >= settings.maxSessionsPerDay)}
                onClick={() => setSelectedTime(t)}
                className={cn(
                  "py-4 rounded-xl font-headline transition-all text-xs border uppercase tracking-widest",
                  selectedTime === t 
                    ? "bg-primary-fixed text-black font-black border-primary-fixed" 
                    : "glass-panel border-white/5 text-zinc-500 hover:border-primary-fixed/30 disabled:opacity-30"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        {/* Step 4: Summary */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-headline text-[10px] text-primary-fixed px-2 py-1 bg-primary-fixed/10 rounded tracking-widest border border-primary-fixed/20 uppercase">Passo 4</span>
            <h3 className="font-headline text-xl">Pagamento</h3>
          </div>
          <motion.div className="glass-panel p-8 rounded-2xl border border-white/5 space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-on-surface-variant font-headline text-[10px] uppercase tracking-widest">
                <span>Valor estimado</span>
                <span className="text-white text-sm">R$ {estimatedValue}</span>
              </div>
              <div className="flex justify-between items-center text-on-surface-variant font-headline text-[10px] uppercase tracking-widest">
                <span>Saldo VIP</span>
                <span className="text-primary-fixed text-sm">R$ {creditsAvailable}</span>
              </div>
              
              <div className="flex justify-between items-center bg-primary-fixed/10 p-4 rounded-xl border border-primary-fixed/20">
                <div className="flex items-center gap-2">
                   <Zap className="w-4 h-4 text-primary-fixed fill-primary-fixed" />
                   <span className="text-primary-fixed text-xs font-headline font-black uppercase tracking-widest">Desconto Aplicado</span>
                </div>
                <span className="text-primary-fixed font-headline text-xl font-black">- R$ {maxCreditUsage}</span>
              </div>
            </div>

            <div className="bg-primary-fixed p-6 rounded-xl shadow-lg shadow-primary-fixed/10">
               <p className="text-black text-center font-headline font-black uppercase tracking-widest text-sm">Pagar sinal: R$ {depositValue}</p>
            </div>
            
            <p className="text-[10px] text-center text-zinc-500 uppercase tracking-widest font-headline font-medium leading-relaxed">
              O agendamento ficará em análise<br/>
              <span className="italic opacity-70">Aguarde aprovação para pagar o sinal.</span>
            </p>
          </motion.div>
        </section>

        <section className="pt-4 pb-12">
           <button 
             onClick={handleConfirm}
             disabled={loading || !selectedDate || !selectedTime || (settings && bookingsOnDay >= settings.maxSessionsPerDay)}
             className="w-full bg-primary-fixed text-black h-16 rounded-2xl font-headline font-black tracking-widest flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-primary-fixed/20 uppercase disabled:opacity-50"
           >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  Solicitar Agendamento
                  <ChevronRight className="w-6 h-6" />
                </>
              )}
           </button>
        </section>
      </main>
    </div>
  );
}
