import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowLeft, ShieldCheck, Timer } from 'lucide-react';
import { motion } from 'motion/react';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { signInAnonymously } from 'firebase/auth';

export default function Verify() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const phone = location.state?.phone || '(00) 00000-0000';
  const isDemo = location.state?.isDemo || false;

  useEffect(() => {
    // If in demo mode, auto-fill standard test code
    if (isDemo) {
      setCode(['1', '2', '3', '4', '5', '6']);
    }
  }, [isDemo]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      document.getElementById(`code-${index + 1}`)?.focus();
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    const verificationCode = code.join('');
    if (verificationCode.length !== 6) return;

    setLoading(true);
    setError('');

    try {
      let user;
      
      if (isDemo) {
        // Mock sign in for demo/preview - requires Anonymous Auth enabled in console
        try {
          const result = await signInAnonymously(auth);
          user = result.user;
        } catch (anonErr: any) {
          console.error('Anonymous Auth Error:', anonErr);
          if (anonErr.code === 'auth/operation-not-allowed') {
            throw new Error('Ative "Login Anônimo" no Console do Firebase para usar o Modo Demo.');
          }
          throw anonErr;
        }
      } else {
        const confirmationResult = (window as any).confirmationResult;
        if (!confirmationResult) {
          throw new Error('Sessão expirada. Volte para a tela anterior e peça o código novamente.');
        }

        const result = await confirmationResult.confirm(verificationCode);
        user = result.user;
      }

      if (!user) throw new Error('Falha na autenticação.');

      // Check if user already has a profile
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        navigate('/');
      } else {
        navigate('/welcome');
      }
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message || '';
      if (errorMessage.includes('auth/invalid-verification-code')) {
        setError('Código de verificação inválido.');
      } else if (errorMessage.includes('auth/session-expired')) {
        setError('Sessão expirada. Tente reenviar o código.');
      } else {
        setError(err.message || 'Código inválido ou erro de conexão.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-surface font-sans min-h-screen flex flex-col items-center">
      <header className="fixed top-0 left-0 w-full px-6 py-6 flex items-center z-50">
        <button 
          onClick={() => navigate('/login')}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-surface-container-high transition-transform active:scale-90"
        >
          <ArrowLeft className="w-6 h-6 text-primary" />
        </button>
      </header>

      <main className="w-full max-w-md mx-auto flex flex-col items-center pt-24 px-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-12 text-center"
        >
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-container to-secondary-container flex items-center justify-center neon-glow">
              <ShieldCheck className="w-8 h-8 text-black" />
            </div>
          </div>
          <h1 className="font-headline text-4xl text-primary mb-2">Digite o código</h1>
          <p className="font-sans text-sm text-on-surface-variant max-w-[280px] mx-auto leading-relaxed">
            Enviamos um código de segurança para <strong>{phone}</strong>.
          </p>
          {error && <p className="text-red-500 mt-4 text-xs font-headline uppercase tracking-wider">{error}</p>}
        </motion.div>

        <form onSubmit={handleConfirm} className="w-full space-y-12">
          <div className="flex justify-between gap-2 sm:gap-4">
            {code.map((digit, i) => (
              <input
                key={i}
                id={`code-${i}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                className="w-12 h-20 bg-surface-container-highest border border-outline-variant rounded-lg text-center font-headline text-3xl text-primary focus:outline-none focus:border-primary-fixed focus:neon-glow transition-all"
                placeholder="•"
              />
            ))}
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 font-sans text-on-surface-variant">
              <Timer className="w-5 h-5" />
              <span>Reenviar código em {countdown}s</span>
            </div>
            <button 
              type="button"
              disabled={countdown > 0}
              className="font-headline text-xs text-secondary uppercase hover:text-primary transition-colors py-2 disabled:opacity-30 tracking-widest"
            >
              Reenviar código
            </button>
          </div>

          <button 
            type="submit"
            disabled={loading || code.join('').length < 6}
            className="w-full h-14 bg-primary-container text-black font-headline text-xl rounded-lg neon-glow active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
          >
            {loading ? 'Confirmando...' : 'Confirmar'}
            {!loading && <ArrowRight className="w-6 h-6" />}
          </button>
        </form>

        <div className="mt-16 opacity-20 flex gap-6 grayscale">
          <img className="w-14 h-14 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDHXYEtiAsJx6AR7NW77GNHsMGvlvFkpxwHjvBBaFUbO_icLxXnSeDlW-dfUSsto0QbQUNnEp3mDytiyEwNlm4rlFPnwFlcZkJQ1hS2ktkZ_Fh28cMNTS09gGbLqTatGCBGuXut_bCgh2z9opHWtrva_0ZjDT6X3NuxahUprRIhzZE1Us0Za8Ba1vrFw7EYHABHOrJ3LmFTP2wmpFdeX7SXqjX6zyBgaK-BYwJtd3-XR-NtYXOCrYQlLpiD4whkb6rAAKzre5TTfC8" alt="Tattoo 1" />
          <img className="w-14 h-14 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCcW5tTX2BfPsh9BDBQLTNrWsWSlz95MO6Ph48KKbGWDRfU8f9VCKtGZMMsYtwLTl2NQ9oFosLtSZtziY0BQ_u2MdOA9eikllNyBANNa58hJ869FXB30Nl1WAkVzQwqPhSAlbUZgl8_oA7b2B7Qw1b52RQR4Co0wG5N-Uw-bOTPhBDOO_g6uYGHWJEHTQ8Rok2Y6X-DFJ3Mb3JJsFk7DFV3RnrrFaNjP4cH_XfKDPI1JKGZBMzOdSOTXjQOahczNi0jxI2yrNwzfXQ" alt="Tattoo 2" />
          <img className="w-14 h-14 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAehSf_sy8fWnQCMj77xIpVEkBHCdtV9zdfmNjhXsgzxuF6mXNWjQ6qB3oiTC1NG3-eT9hOjCm-KopOeZ788rBTbYA91cj44O0B612bRJ-OuXTKxgc4SxAqAs6VVPXXfj-Wui6-x-2etWVhS_8Nd-sr8UbhJwbJb0T72N0n_hBQ2ks4HtBHGulN8YQOk7GP_-wp2wA2ik7aWlM9LRtIU8sMmnvbQ9vFPHumjWwLdldTzCfgX9hi66JEAxVrHu3NxEtlZw1Rdtf2rLs" alt="Tattoo 3" />
        </div>
      </main>

      <div className="fixed -bottom-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-container/10 rounded-full blur-[120px] pointer-events-none"></div>
    </div>
  );
}
