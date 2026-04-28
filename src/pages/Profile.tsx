import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { User, Edit3, Wallet, Send, ChevronRight, UserCog, Bell, FileText, Shield, LogOut, Trash2, Diamond } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Profile() {
  const { profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [showTransfer, setShowTransfer] = useState(false);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  return (
    <div className="bg-background text-on-surface font-sans min-h-screen pb-32">
      <header className="bg-zinc-950/80 backdrop-blur-xl border-b border-white/10 fixed top-0 z-50 flex justify-between items-center w-full px-6 py-4">
        <div className="flex items-center gap-3">
          <Diamond className="text-primary-fixed w-6 h-6 fill-primary-fixed/20" />
          <h1 className="font-headline text-xl font-black text-primary-fixed uppercase tracking-widest leading-none">INK EXCLUSIVE</h1>
        </div>
        <div className="w-10 h-10 rounded-full border-2 border-primary-fixed overflow-hidden bg-zinc-800 flex items-center justify-center">
           {profile?.avatar ? <img alt="Profile" className="w-full h-full object-cover" src={profile.avatar} /> : <span className="text-primary-fixed font-headline">{profile?.name?.[0]}</span>}
        </div>
      </header>

      <main className="pt-24 px-6 max-w-lg mx-auto space-y-10">
        <section className="flex flex-col items-center">
          <div className="relative mb-6">
            <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-surface-container-highest shadow-[0_0_40px_rgba(204,255,0,0.15)] group relative">
              {profile?.avatar ? (
                <img alt="User" className="w-full h-full object-cover" src={profile.avatar} />
              ) : (
                <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-primary-fixed text-4xl font-headline font-black">
                  {profile?.name?.[0]}
                </div>
              )}
            </div>
            <button className="absolute -bottom-2 -right-2 bg-primary-fixed p-3 rounded-2xl text-black shadow-lg shadow-primary-fixed/20 active:scale-90 transition-transform">
              <Edit3 className="w-5 h-5" />
            </button>
          </div>
          <h2 className="font-headline text-3xl text-primary">{profile?.name || 'Membro VIP'}</h2>
          <p className="text-zinc-500 font-sans mt-1">{profile?.phone}</p>
        </section>

        {/* Credits Transfer Card */}
        <section className="space-y-4">
          <h3 className="font-headline text-[10px] text-zinc-500 uppercase tracking-widest font-black">Fidelidade & Créditos</h3>
          <div className="glass-panel border border-white/5 p-8 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-fixed/10 blur-[60px] rounded-full -mr-16 -mt-16 group-hover:bg-primary-fixed/20 transition-all duration-700"></div>
            
            <div className="flex justify-between items-start mb-8 transition-transform group-hover:translate-x-1 duration-500">
              <div>
                <p className="text-zinc-400 text-sm font-medium">Seus créditos</p>
                <p className="font-headline text-5xl text-primary-fixed drop-shadow-[0_0_15px_rgba(204,255,0,0.3)]">
                  R$ {profile?.creditsBalance || 0},00
                </p>
              </div>
              <Wallet className="text-primary-fixed w-10 h-10 mt-1 opacity-80" />
            </div>

            <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
              Envie créditos para amigos e familiares usarem no estúdio. Seus indicados ganham 10% de bônus na primeira tatuagem.
            </p>

            <button className="w-full h-16 bg-primary-fixed text-black font-headline text-[10px] rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-primary-fixed/20 uppercase tracking-[0.2em] font-black">
              <Send className="w-4 h-4" />
              Transferir Créditos
            </button>
          </div>
        </section>

        {/* Account Menu */}
        <section className="space-y-4">
          <h3 className="font-headline text-[10px] text-zinc-500 uppercase tracking-widest font-black">Conta</h3>
          <div className="bg-surface-container-low border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
            {[
              { label: 'Editar dados', icon: UserCog, action: () => {} },
              { label: 'Notificações', icon: Bell, action: () => {} },
              { label: 'Termos de uso', icon: FileText, action: () => navigate('/terms') },
              { label: 'Política de privacidade', icon: Shield, action: () => {} },
              { label: 'Sair da conta', icon: LogOut, action: handleLogout, danger: true },
            ].map((item, i) => (
              <button
                key={i}
                onClick={item.action}
                className="flex items-center justify-between w-full p-5 hover:bg-white/5 transition-all group active:bg-white/10"
              >
                <div className="flex items-center gap-4">
                  <div className={cn("p-2 rounded-xl transition-colors", item.danger ? "bg-red-500/10 text-red-400 group-hover:bg-red-500 group-hover:text-white" : "bg-zinc-900 text-zinc-500 group-hover:text-primary-fixed")}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className={cn("font-sans font-semibold", item.danger ? "text-red-400" : "text-primary")}>{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-700" />
              </button>
            ))}
          </div>
        </section>

        {isAdmin && (
           <section className="space-y-4">
             <h3 className="font-headline text-[10px] text-primary-fixed uppercase tracking-widest font-black">Admin</h3>
             <button 
               onClick={() => navigate('/admin')}
               className="w-full p-5 glass-panel rounded-2xl flex items-center justify-between border-primary-fixed/20 hover:bg-primary-fixed/5 transition-all group"
             >
               <div className="flex items-center gap-4">
                 <Shield className="w-6 h-6 text-primary-fixed" />
                 <span className="font-headline font-black uppercase text-primary-fixed">Painel Administrativo</span>
               </div>
               <ChevronRight className="w-5 h-5 text-primary-fixed" />
             </button>
           </section>
        )}

        {/* Security Section */}
        <section className="mb-12">
          <h3 className="font-headline text-[10px] text-zinc-500 uppercase tracking-widest font-black mb-4">Segurança</h3>
          <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-2xl space-y-6">
            <p className="text-zinc-500 text-sm leading-relaxed font-sans">
              Você poderá solicitar a exclusão definitiva dos seus dados e créditos a qualquer momento. Esta ação é irreversível.
            </p>
            <button className="flex items-center justify-center gap-3 w-full py-4 rounded-xl border border-red-500/40 text-red-400 font-headline text-[10px] uppercase tracking-widest font-bold hover:bg-red-500 hover:text-white transition-all active:scale-95">
              <Trash2 className="w-4 h-4" />
              Excluir minha conta
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
