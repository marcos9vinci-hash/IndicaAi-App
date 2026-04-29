import React from 'react';
import { Share2, Copy, Info, Users, Sparkles, CheckCircle2, Calendar, LogIn, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

export default function Network() {
  const { profile } = useAuth();

  const handleCopy = () => {
    if (profile?.inviteCode) {
      navigator.clipboard.writeText(profile.inviteCode);
      alert('Código copiado!');
    }
  };

  return (
    <div className="bg-background text-on-surface font-sans min-h-screen pb-32">
      <header className="bg-zinc-950/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50 flex items-center justify-between px-6 h-16 w-full">
        <h1 className="font-headline text-2xl font-black tracking-tighter text-primary-fixed drop-shadow-[0_0_8px_rgba(204,255,0,0.4)] uppercase">Rede</h1>
        <div className="w-10 h-10 rounded-full border border-white/20 overflow-hidden bg-zinc-800 flex items-center justify-center">
           {profile?.avatar ? <img alt="Profile" className="w-full h-full object-cover" src={profile.avatar} /> : <span className="text-primary-fixed font-headline">{profile?.name?.[0]}</span>}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <section className="space-y-2">
          <h2 className="font-headline text-4xl text-primary leading-tight">Indique e ganhe créditos</h2>
          <p className="text-on-surface-variant text-lg">Seus amigos tatuam e você acumula créditos para sua próxima obra de arte.</p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Invite & Metrics */}
          <div className="space-y-8">
            {/* Invite Card */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-panel p-6 rounded-xl relative overflow-hidden group border-primary-fixed/20 shadow-lg shadow-primary-fixed/5"
            >
              <div className="relative z-10 space-y-6">
                <span className="font-headline text-[10px] text-primary-fixed uppercase tracking-widest">Seu link de convite</span>
                
                <div className="bg-black/40 border border-white/10 rounded-lg p-4 flex items-center justify-between">
                  <span className="font-headline text-2xl text-white tracking-widest">{profile?.inviteCode || 'CARREGANDO...'}</span>
                  <button onClick={handleCopy} className="text-zinc-500 hover:text-white transition-colors">
                    <Copy className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleCopy}
                    className="bg-primary-fixed text-black font-headline text-xs py-4 rounded-lg flex items-center justify-center gap-2 neon-glow active:scale-95 transition-all uppercase tracking-widest font-bold"
                  >
                    <Copy className="w-4 h-4" />
                    Copiar Link
                  </button>
                  <button className="border border-white/20 text-white font-headline text-xs py-4 rounded-lg flex items-center justify-center gap-2 hover:bg-white/5 transition-all uppercase tracking-widest font-bold">
                    <Share2 className="w-4 h-4" />
                    Compartilhar WhatsApp
                  </button>
                </div>
                
                <p className="text-xs text-zinc-400 font-sans italic opacity-80">
                  Convide amigos e ganhe créditos quando eles tatuarem.
                </p>
              </div>
            </motion.div>

            {/* Info Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-5 h-5 text-primary-fixed" />
                <h4 className="font-headline text-xs font-bold text-white uppercase tracking-wider">Como você ganha créditos</h4>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed font-sans">
                <span className="text-primary-fixed font-medium">Nível 1</span> → ganha mais créditos | 
                <span className="text-secondary-container font-medium">Nível 2</span> → ganha créditos médios | 
                <span className="text-zinc-300 font-medium">Nível 3</span> → ganha créditos menores.
                <br />
                <span className="italic text-xs mt-2 block opacity-70">Créditos são liberados após a conclusão da tattoo.</span>
              </p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 gap-4">
              <div className="glass-panel p-6 rounded-xl flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                   <div className="flex items-center gap-3">
                      <Users className="w-6 h-6 text-zinc-400" />
                      <span className="text-zinc-400 text-sm font-headline uppercase tracking-widest">Pessoas na rede</span>
                   </div>
                   <span className="text-2xl font-headline text-white font-black">18</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                   <div className="flex items-center gap-3">
                      <Sparkles className="w-6 h-6 text-zinc-400" />
                      <span className="text-zinc-400 text-sm font-headline uppercase tracking-widest">Tattoos geradas</span>
                   </div>
                   <span className="text-2xl font-headline text-white font-black">6</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                   <div className="flex items-center gap-3">
                      <Sparkles className="w-6 h-6 text-primary-fixed" />
                      <span className="text-zinc-400 text-sm font-headline uppercase tracking-widest">Créditos ganhos</span>
                   </div>
                   <span className="text-2xl font-headline text-primary-fixed font-black">R$ 420</span>
                </div>
              </div>
            </div>

            {/* Rewards Progress */}
            <div className="glass-panel p-4 rounded-xl border-primary-fixed/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-zinc-400 font-headline uppercase tracking-widest">Próxima Recompensa</span>
                <span className="text-[10px] text-tertiary-fixed font-headline font-bold uppercase tracking-widest">Flash Tattoo Grátis</span>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-secondary-container to-primary-fixed w-[70%]"></div>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-zinc-500 font-sans">6/10 Tattoos</span>
                <span className="text-[10px] text-zinc-500 font-sans">Meta: 10</span>
              </div>
            </div>
          </div>

          {/* Right Column: Network List */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h3 className="font-headline text-3xl text-primary tracking-tight">Sua rede</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="font-headline text-[10px] text-zinc-500 uppercase tracking-widest">Nível 1</span>
                  <div className="h-px flex-1 bg-white/10"></div>
                  <span className="text-[10px] text-zinc-500 italic opacity-60">Indicações Diretas</span>
                </div>

                <div className="space-y-3">
                  <div className="glass-panel p-4 rounded-xl bg-primary-fixed/5 border-primary-fixed/30 neon-glow relative">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full border-2 border-primary-fixed overflow-hidden bg-zinc-800">
                          <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB-dGqhUKiP7oG65ydiuO7FQQE5DbPeRnvhUAHD3AjcGO8rKzcJvyEUfsGK9b7BZyhOCEvxQn2Sl72ejF797HWg7yfu7-KP9itK3-J1RqCBpxdKqjkppvq447qeBhpp3RHdadF9AF9ObObruhMqFwfeiWgf64Q4Waevch0cVaoVDL9ZbdVLxUQrn7xPS0eJhhcS8Gw9S3sTBOAawU_6qYyl8JkahcwZQLAEHfX-bMgDr2zX15fwKpAqUTO0HxtNriQR00qwmuGsKh0" alt="Ricardo" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-white">Ricardo Mendes</p>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-headline">há 2 dias</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="bg-primary-fixed text-black text-[10px] font-black px-2 py-0.5 rounded shadow-sm font-headline">CONCLUÍDA</span>
                        <span className="text-primary-fixed font-bold text-sm mt-1">+ R$ 150,00</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-primary-fixed mt-4">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider font-headline">Tattoo concluída</span>
                    </div>
                  </div>

                  <div className="glass-panel p-4 rounded-xl border-white/5 opacity-80">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-zinc-800 border border-white/10 overflow-hidden">
                           <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB4knEhftbKvm-zSZbmwNMlDEYHY0XtJGj8do5WP9t2rtlBqhxrbAAO6VOXnm3RTRkC5nHGQiJOplKLqTGq-jkUPMuzvDlK6cRmKEDLwG6F38b25ePNv5bXWEOZXaqvBOoo_b14ogN1ylZVezlYVp7x1M32hc5beckKtmdODKVPVHL5n20EM5WDiLOMsDc8ElGeuDOqPikNVzBpGhHvS0604IdFe827daqPDuigMzwSg30icNRB0lR8byG8GDYweR1RXNHpaS0NlVA" alt="Carla" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-white">Carla Dias</p>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-headline">há 5 dias</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-secondary-container">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-bold font-headline uppercase tracking-wider">Agendou tattoo</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button className="w-full bg-primary-fixed text-black font-headline font-black py-5 rounded-2xl shadow-xl shadow-primary-fixed/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest">
               <UserPlus className="w-6 h-6" />
               Convidar mais amigos
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
