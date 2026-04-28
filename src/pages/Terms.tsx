import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react';

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="bg-background text-on-surface font-sans min-h-screen flex flex-col">
      <header className="bg-zinc-950/80 backdrop-blur-xl border-b border-white/10 fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 py-4 shadow-[0_0_20px_rgba(204,255,0,0.05)]">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-primary-fixed w-6 h-6" />
          <span className="text-xl font-bold tracking-widest text-primary-fixed font-headline uppercase">INK CIRCLE</span>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center px-6 pt-24 pb-12">
        <div className="max-w-[480px] w-full flex flex-col gap-10">
          <div className="relative w-full h-64 rounded-xl overflow-hidden mb-4 border border-white/10">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10"></div>
            <img 
              alt="Legal Background" 
              className="w-full h-full object-cover grayscale opacity-60" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD6CYbCgzueyX8cPlydTTuPmH_xXTnbenZ0siEVhdOKA62dpJDDqB6kpVFMkVxybWT-8VLoAzoEh9f0T4XXX3ikBLdoikVFoaFlCT1T5vmyVxwbnjXKvRUKxJA-DiY4S5YwII9tzj-ktitZcr2qu1_uJBpRK-tXRezjFhriw58SPOJRwbu1uvPSNwccciXoZeLlcRr52zWTnQUr1ue-tFlRjhgerO1DB4lOa77QZ4KAMeL00e5tLe1fORh5g3efMnciaXl-XXXa2xU" 
            />
            <div className="absolute bottom-4 left-4 z-20">
              <span className="bg-primary-fixed/10 text-primary-fixed text-[10px] px-3 py-1 rounded-full border border-primary-fixed/20 mb-2 inline-block uppercase font-headline">Compliance</span>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="font-headline text-4xl text-primary leading-tight">Antes de continuar</h1>
            <p className="text-on-surface-variant text-lg">
              Precisamos que você aceite nossos termos para usar o app.
            </p>
          </div>

          <div className="bg-primary-fixed/5 border border-primary-fixed/20 p-5 rounded-xl space-y-3">
             <h4 className="text-primary-fixed font-headline text-[10px] tracking-widest uppercase">Regras Críticas</h4>
             <ul className="text-xs text-zinc-400 space-y-2 list-disc pl-4 font-sans">
                <li>Créditos válidos por <span className="text-white">6 meses</span>.</li>
                <li>Uso limitado a <span className="text-white">50% do valor</span> da tatuagem.</li>
                <li>Créditos <span className="text-white">não são conversíveis</span> em dinheiro.</li>
                <li>Sinal de agendamento <span className="text-white">não reembolsável</span>.</li>
             </ul>
          </div>

          <div className="glass-panel p-6 rounded-xl space-y-6">
            <label className="flex items-start gap-4 cursor-pointer group">
              <div className="mt-1">
                <input type="checkbox" className="w-6 h-6 rounded border-outline-variant bg-surface-container-highest text-primary-fixed focus:ring-primary-fixed transition-all" />
              </div>
              <div className="flex flex-col">
                <span className="text-on-surface font-medium transition-colors group-hover:text-primary">Aceito os Termos de Uso</span>
                <button className="text-primary-fixed text-xs mt-1 flex items-center gap-1 hover:underline font-headline">
                  Ler documento <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </label>
            <div className="h-px bg-white/5 w-full"></div>
            <label className="flex items-start gap-4 cursor-pointer group">
              <div className="mt-1">
                <input type="checkbox" className="w-6 h-6 rounded border-outline-variant bg-surface-container-highest text-primary-fixed focus:ring-primary-fixed transition-all" />
              </div>
              <div className="flex flex-col">
                <span className="text-on-surface font-medium transition-colors group-hover:text-primary">Aceito a Política de Privacidade</span>
                <button className="text-primary-fixed text-xs mt-1 flex items-center gap-1 hover:underline font-headline">
                  Ler documento <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </label>
          </div>

          <div className="flex flex-col gap-6">
            <button 
              onClick={() => navigate('/')}
              className="w-full h-14 bg-primary-fixed text-black font-headline text-xl rounded-lg flex items-center justify-center gap-2 neon-glow hover:bg-primary-fixed/90 active:scale-95 transition-all"
            >
              Entrar no app
              <ArrowRight className="w-6 h-6" />
            </button>
            <p className="text-center text-[10px] text-zinc-500 uppercase tracking-widest px-4 opacity-60 font-headline leading-relaxed">
              Ao clicar em entrar, você confirma que leu e concorda com todos os termos acima descritos pela Ink Circle.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
