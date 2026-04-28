import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { StudioRule } from '../types';
import { motion } from 'motion/react';
import { ChevronLeft, Info, HelpCircle, Shield, CreditCard, Calendar, AlertCircle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HowItWorks() {
  const navigate = useNavigate();
  const [rules, setRules] = useState<StudioRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const q = query(
          collection(db, 'studio_rules'), 
          where('active', '==', true),
          orderBy('order', 'asc')
        );
        const snap = await getDocs(q);
        setRules(snap.docs.map(d => ({ id: d.id, ...d.data() } as StudioRule)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRules();
  }, []);

  const getIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('crédito')) return <CreditCard className="w-5 h-5 text-primary-fixed" />;
    if (t.includes('expir')) return <Shield className="w-5 h-5 text-primary-fixed" />;
    if (t.includes('sinal')) return <AlertCircle className="w-5 h-5 text-red-400" />;
    if (t.includes('remarca')) return <Calendar className="w-5 h-5 text-blue-400" />;
    return <Sparkles className="w-5 h-5 text-zinc-400" />;
  };

  return (
    <div className="bg-background text-on-surface font-sans min-h-screen pb-20">
      <header className="fixed top-0 w-full z-50 flex items-center px-6 h-20 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-zinc-400">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="ml-2 text-primary-fixed font-headline font-black tracking-widest text-xl uppercase">Como Funciona</h1>
      </header>

      <main className="pt-28 px-6 space-y-8">
        <section className="text-center space-y-2">
          <div className="inline-flex p-3 bg-primary-fixed/10 rounded-full border border-primary-fixed/20 mb-2">
            <HelpCircle className="w-8 h-8 text-primary-fixed" />
          </div>
          <h2 className="font-headline text-3xl">Membership FAQ</h2>
          <p className="text-on-surface-variant font-medium text-sm">Entenda como aproveitar seu clube VIP</p>
        </section>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary-fixed border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {rules.map((rule, idx) => (
              <motion.div 
                key={rule.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-panel p-6 rounded-2xl border border-white/5 space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-zinc-900 rounded-lg border border-white/5">
                    {getIcon(rule.title)}
                  </div>
                  <h3 className="font-headline text-sm uppercase tracking-widest text-white">{rule.title}</h3>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed font-sans">{rule.content}</p>
              </motion.div>
            ))}
            
            {rules.length === 0 && (
              <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
                <p className="text-zinc-500 font-headline uppercase text-[10px] tracking-widest">Nenhuma regra definida ainda.</p>
              </div>
            )}
          </div>
        )}

        <section className="p-8 bg-primary-fixed rounded-2xl text-black space-y-4 shadow-xl shadow-primary-fixed/20">
          <h3 className="font-headline text-lg font-black uppercase tracking-widest">Ainda tem dúvidas?</h3>
          <p className="font-sans font-medium text-sm opacity-80">Entre em contato direto com o estúdio via WhatsApp para suporte personalizado.</p>
          <button className="w-full bg-black text-white h-14 rounded-xl font-headline font-black uppercase tracking-widest text-sm shadow-xl shadow-black/20">
            Falar com Suporte
          </button>
        </section>
      </main>
    </div>
  );
}
