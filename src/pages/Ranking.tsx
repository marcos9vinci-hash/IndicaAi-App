import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Diamond, Stars, TrendingUp, Rocket, Medal } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function Ranking() {
  const { profile } = useAuth();

  return (
    <div className="bg-background text-on-surface font-sans min-h-screen pb-32">
      <header className="bg-zinc-950/80 backdrop-blur-xl border-b border-white/10 fixed top-0 z-50 flex justify-between items-center w-full px-6 py-4 shadow-[0_0_20px_rgba(204,255,0,0.05)]">
        <div className="flex items-center gap-3">
          <Diamond className="text-primary-fixed w-6 h-6 fill-primary-fixed/20" />
          <h1 className="text-xl font-black text-primary-fixed uppercase tracking-widest font-headline">INK EXCLUSIVE</h1>
        </div>
        <div className="w-10 h-10 rounded-full border border-primary-fixed/30 overflow-hidden bg-zinc-800 flex items-center justify-center">
           {profile?.avatar ? <img className="w-full h-full object-cover" src={profile.avatar} alt="Profile" /> : <span className="text-primary-fixed font-headline">{profile?.name?.[0]}</span>}
        </div>
      </header>

      <main className="pt-24 px-6 max-w-lg mx-auto space-y-8">
        <section>
          <h2 className="font-headline text-4xl text-primary tracking-tight leading-tight">Ranking do mês</h2>
          <p className="text-on-surface-variant font-sans text-lg opacity-80">Quem mais gerou tattoos este mês</p>
        </section>

        {/* User Stats Card */}
        <motion.section 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass-panel rounded-2xl p-6 border-primary-fixed/10"
        >
          <div className="flex justify-between items-end mb-4">
            <div>
              <span className="font-headline text-[10px] text-primary-fixed block mb-1 uppercase tracking-widest font-black">Seu nível</span>
              <h3 className="font-headline text-2xl text-primary">{profile?.tier || 'Bronze'}</h3>
            </div>
            <div className="text-right">
              <p className="font-sans text-xs text-on-surface-variant">Falta <span className="text-primary-fixed font-bold">R$ 120</span> para Ouro</p>
            </div>
          </div>
          <div className="relative h-4 w-full bg-surface-container-highest rounded-full overflow-hidden flex items-center p-[2px]">
            <div className="h-full bg-gradient-to-r from-secondary-container to-primary-fixed w-[65%] rounded-full shadow-[0_0_15px_rgba(195,244,0,0.3)]"></div>
          </div>
          <div className="flex justify-between mt-2 px-1">
            <span className="text-[10px] font-headline font-black text-on-surface-variant uppercase tracking-widest">Bronze</span>
            <span className="text-[10px] font-headline font-black text-primary-fixed uppercase tracking-widest">Prata</span>
            <span className="text-[10px] font-headline font-black text-on-surface-variant opacity-40 uppercase tracking-widest">Ouro</span>
            <span className="text-[10px] font-headline font-black text-on-surface-variant opacity-40 uppercase tracking-widest">Diamante</span>
          </div>
        </motion.section>

        {/* Podium */}
        <section className="grid grid-cols-3 gap-2 items-end pt-4">
          {/* 2nd */}
          <div className="flex flex-col items-center">
            <div className="relative mb-3">
              <div className="w-16 h-16 rounded-full border-2 border-slate-400 overflow-hidden bg-zinc-800">
                <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDn5_2Slxjfl0c_-Re6zQLjwv4q3CR7I5_nCR7bGX9cYC14npRrQA7sYQcxTMmVIN9vAdDcR7MlFmJUCUvzf4z1GsoeHhLVR25Nokmwm9uaUVjAmiejolhrr39ABvCD8fpmu5OKBShYLEHfQBZ72ElJHPob7r26xjSXo_Ky__Xlao39qjMmKK_jxAgTrLcIcnMgFL_CBleDuDYDpsfZCCPYqveKiXL4A6oFdL3-xIl-WFc-LuD37F9oltLVBWvwj41FLQbJX6jF2Po" alt="2nd" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-slate-400 rounded-full flex items-center justify-center text-zinc-900 font-bold text-sm font-headline">2</div>
            </div>
            <div className="glass-panel w-full h-24 rounded-t-xl flex flex-col items-center justify-center p-2 text-center border-slate-400/20">
              <span className="text-[10px] font-headline text-white/50 uppercase tracking-widest truncate w-full">Carlos</span>
              <span className="text-sm text-primary-fixed font-black font-headline">R$ 320</span>
            </div>
          </div>
          {/* 1st */}
          <div className="flex flex-col items-center">
             <div className="relative mb-3 scale-110">
              <div className="w-20 h-20 rounded-full border-4 border-primary-fixed overflow-hidden bg-zinc-800 neon-glow">
                <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCpcKiesFNdKdNyWkk3xf7UkbZ244xtNseysEoj0KL9CDM-QL9MMc0twqVV4NIpJnxW4ynDREIAZrcvCZiRYG5XnI2Xx_6-OGUDBDuuHpLHG-eB_EpW57Iia5-W9jCBJ4JX0xj0-d7Yg-yiZzo9WSO4sXYlrr_nnFtagnQGaYGuCP-WV9_U4nOiprPN2ls_o7tEtRsiNHtv8n_ru_iTxr48i2RcITYYBM-YV1ISQUNfUzT_1OEuFK04puBLt3jEIdpOid_B-Uskkck" alt="1st" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary-fixed rounded-full flex items-center justify-center text-zinc-950 font-black text-lg font-headline">1</div>
              <Stars className="absolute -top-7 left-1/2 -translate-x-1/2 text-tertiary-fixed w-8 h-8" fill="currentColor" />
            </div>
            <div className="bg-primary-fixed w-full h-36 rounded-t-2xl flex flex-col items-center justify-center p-2 text-center shadow-xl shadow-primary-fixed/20">
              <span className="text-[10px] font-headline text-black font-black uppercase tracking-widest truncate w-full">Maria</span>
              <span className="text-xl text-black font-black font-headline">R$ 500</span>
            </div>
          </div>
          {/* 3rd */}
          <div className="flex flex-col items-center">
            <div className="relative mb-3">
              <div className="w-16 h-16 rounded-full border-2 border-amber-700 overflow-hidden bg-zinc-800">
                <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCpXIlZ4KUMlSGd4zESrE56dVXkmmVjPbseeX076GG4P_MBmPIEKxTVFLTVJx2Z8Ty1pzK1RyVXJ00JqC9kF1aDY2RwsrMLB0mqPXUzmjkcrEDEfR0d8uJLurXu6yHril0awz4hUN3YFMZuGOp4Lhv8yucY9I89htXTS7xUQLckUvUTSAsdfCyj6PBW_6SAWzKHStf9hLj5mNP2E3Y1furQj0SzCdOIOPRdQL3FWL-KV9dLY-kNQycpsYgj-bw0R5zjt97irEq9fF4" alt="3rd" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-amber-700 rounded-full flex items-center justify-center text-white font-bold text-sm font-headline">3</div>
            </div>
            <div className="glass-panel w-full h-20 rounded-t-xl flex flex-col items-center justify-center p-2 text-center border-amber-700/20">
              <span className="text-[10px] font-headline text-white/50 uppercase tracking-widest truncate w-full">Ana</span>
              <span className="text-sm text-primary-fixed font-black font-headline">R$ 280</span>
            </div>
          </div>
        </section>

        {/* User Rank Status */}
        <section>
          <div className="bg-primary-fixed/5 border border-primary-fixed/20 rounded-2xl p-6 flex items-center gap-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-primary-fixed"></div>
            <div className="flex-1">
              <h4 className="font-headline text-[10px] text-primary-fixed uppercase tracking-widest font-black mb-1">Sua posição atual</h4>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-headline text-2xl text-primary font-black">Você está em #12 lugar</span>
              </div>
              <p className="text-sm text-on-surface-variant font-sans leading-relaxed">
                Faltam <span className="text-primary font-bold">R$ 120</span> em créditos para o <span className="text-primary-fixed font-bold">Top 10</span>
              </p>
            </div>
            <div className="p-3 bg-zinc-900 rounded-full">
              <TrendingUp className="text-primary-fixed w-8 h-8" />
            </div>
          </div>
        </section>

        {/* Promotion */}
        <section>
          <div className="bg-gradient-to-r from-secondary-container to-secondary-container/40 rounded-2xl p-6 flex justify-between items-center group active:scale-[0.98] transition-transform shadow-lg shadow-secondary-container/10">
            <div className="z-10 flex-1">
               <h4 className="font-headline text-[10px] text-secondary-container uppercase tracking-widest font-black mb-2 opacity-80">Desafio do mês</h4>
               <p className="text-white font-bold text-lg leading-snug">Indique 3 amigos que tatuem e ganhe bônus de <span className="text-primary-fixed">R$ 50</span> em créditos.</p>
            </div>
            <Rocket className="w-10 h-10 text-white/20 group-hover:text-white/40 transition-colors ml-4" />
          </div>
        </section>

        {/* Full List */}
        <section className="space-y-3 pb-8">
           <div className="flex justify-between px-4 pb-2">
              <span className="text-[10px] font-headline text-zinc-500 uppercase tracking-widest font-black">Posição</span>
              <span className="text-[10px] font-headline text-zinc-500 uppercase tracking-widest font-black">Créditos</span>
           </div>
           {[
             { rank: '#4', name: 'Lucas Oliveira', credits: 'R$ 250' },
             { rank: '#5', name: 'Beatriz Santos', credits: 'R$ 245' },
             { rank: '#12', name: 'João (Você)', credits: 'R$ 180', me: true },
             { rank: '#13', name: 'Fernando Costa', credits: 'R$ 175' },
             { rank: '#14', name: 'Sofia Lima', credits: 'R$ 160' }
           ].map((item, i) => (
             <div 
               key={i} 
               className={cn(
                 "p-4 rounded-xl flex items-center justify-between border transition-all",
                 item.me 
                   ? "bg-primary-fixed/10 border-primary-fixed/40 neon-glow" 
                   : "glass-panel border-white/5 opacity-80"
               )}
             >
                <div className="flex items-center gap-6">
                   <span className={cn("font-headline text-lg w-8", item.me ? "text-primary-fixed font-black" : "text-zinc-500")}>{item.rank}</span>
                   <span className={cn("text-sm font-bold", item.me ? "text-primary" : "text-zinc-300")}>{item.name}</span>
                </div>
                <span className={cn("font-headline text-sm font-black", item.me ? "text-primary-fixed" : "text-zinc-400")}>{item.credits}</span>
             </div>
           ))}
        </section>
      </main>
    </div>
  );
}
