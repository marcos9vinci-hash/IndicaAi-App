import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize Recaptcha
    (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      }
    });
  }, []);

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 8) return;

    setLoading(true);
    setError('');

    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+55${phone.replace(/\D/g, '')}`;
      
      // Verification for test numbers
      const isTestNumber = formattedPhone === '+5511999999999';
      
      const appVerifier = (window as any).recaptchaVerifier;
      const confirmationResult: ConfirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      
      (window as any).confirmationResult = confirmationResult;
      navigate('/verify', { state: { phone: formattedPhone } });
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Erro: SMS ou Região (Brasil) não habilitada no Console > Authentication > Configurações > Política de SMS.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Muitas tentativas. Use o modo demo para continuar testando sem SMS.');
      } else {
        setError('Erro ao enviar SMS. Verifique se o número está correto ou use o modo demo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoMode = async () => {
    setLoading(true);
    try {
      // In demo mode we guide the user to use the test credentials we set up in the console
      navigate('/verify', { state: { phone: '+5511999999999', isDemo: true } });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-surface font-sans min-h-screen flex flex-col items-center">
      <div id="recaptcha-container"></div>
      
      <header className="w-full max-w-md px-6 py-6 flex items-center justify-between">
        <div className="h-1 w-24 bg-surface-container-highest rounded-full overflow-hidden">
          <div className="h-full w-1/2 bg-primary-fixed"></div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-md px-6 pt-12 pb-20 flex flex-col">
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="font-headline text-4xl text-primary mb-4 leading-tight">Informe seu telefone</h1>
          <p className="text-lg text-on-surface-variant">
            Enviaremos um código de verificação por SMS.
          </p>
          {error && <p className="text-red-500 mt-4 text-sm font-headline uppercase tracking-wider">{error}</p>}
        </motion.section>

        <section className="flex-1 space-y-6">
          <div className="space-y-2">
            <label className="font-headline text-xs text-on-surface-variant uppercase tracking-widest">Número de telefone</label>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 h-16 rounded-lg glass-panel hover:bg-surface-container-highest transition-colors">
                <img 
                  alt="Brasil" 
                  className="w-6 h-4 object-cover rounded-sm" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTeVJZV18gs4aoneAewE7LqYIQ_fi24iHe8vJSsEDVt81F-77YYKqinn72tWIhsN53uoYu4NrtXuMGQnHeNRYcURU0TJLI80t_4t1ejYBnrCJLXtwlChG8vhq3l3mNgg9uMgWTB1FuajxZXByWDKEoyuN5C0ReNfTZD2pxdDY-DC7X1_9UOmdX1dtkM3u-dQ-iMk4W-7n1GsZk8iwwvQbtXOigLbIyDMeLvgnCX3xngXnfaOEqKDxKNn0YWPv6T59PKhX32UVhkOQ" 
                />
                <span className="font-headline text-xl text-primary">+55</span>
                <ChevronDown className="w-4 h-4 text-on-surface-variant" />
              </button>
              
              <div className="flex-1">
                <input 
                  autoFocus
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-16 bg-surface-container-low border-0 border-b-2 border-outline-variant focus:border-primary-fixed focus:ring-0 text-2xl font-headline text-primary px-4 transition-all placeholder:text-zinc-700"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-container-lowest/50 border border-outline-variant/30">
            <ShieldCheck className="w-6 h-6 text-primary-fixed mt-1 flex-shrink-0" />
            <p className="text-xs text-on-surface-variant leading-relaxed font-headline uppercase tracking-wider">
              Sua segurança é nossa prioridade. O número será usado apenas para autenticação e notificações importantes do clube.
            </p>
          </div>
        </section>

        <section className="mt-auto pt-8 flex flex-col gap-3">
          <button 
            onClick={handleNext}
            disabled={loading || phone.length < 8}
            className="w-full h-14 bg-primary-fixed text-black font-headline text-xl rounded-lg flex items-center justify-center gap-2 neon-glow active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
          >
            {loading ? 'Enviando...' : 'Receber código'}
            {!loading && <ArrowRight className="w-6 h-6" />}
          </button>

          {(error || phone === '123') && (
            <button 
              onClick={handleDemoMode}
              className="w-full h-12 border border-primary-fixed/30 text-primary-fixed text-xs font-headline rounded-lg uppercase tracking-widest hover:bg-primary-fixed/10 transition-all flex items-center justify-center gap-2"
            >
              Entrar em Modo Demo (Ignorar SMS)
            </button>
          )}
          
          <p className="mt-2 text-center text-[10px] font-headline text-on-surface-variant uppercase tracking-widest">
            Ao continuar, você concorda com nossos <a className="text-primary-fixed hover:underline" href="/terms">Termos de Uso</a>.
          </p>
        </section>
      </main>

      <div className="fixed top-[-10%] right-[-10%] w-[300px] h-[300px] bg-primary-fixed/10 blur-[120px] pointer-events-none rounded-full"></div>
      <div className="fixed bottom-[-5%] left-[-5%] w-[250px] h-[250px] bg-secondary-container/10 blur-[100px] pointer-events-none rounded-full"></div>
    </div>
  );
}
