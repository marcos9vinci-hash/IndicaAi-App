import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Lock, ArrowRight, UserPlus, Star } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { doc, setDoc, serverTimestamp, getDoc, collection, addDoc, updateDoc, increment } from 'firebase/firestore';
import { UserRole, UserTier, UserProfile, OperationType, NotificationType } from '../types';
import { handleFirestoreError } from '../lib/error-handler';

export default function Welcome() {
  const [inviteCode, setInviteCode] = useState(() => {
    return localStorage.getItem('inviteCode') || '';
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      const cleanRef = ref.toUpperCase().trim();
      setInviteCode(cleanRef);
      localStorage.setItem('inviteCode', cleanRef);
      // Limpa a URL para ficar limpa
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleEnter = async () => {
    if (!inviteCode) {
      setError('Por favor, informe seu código de convite.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      // 1. Verify invite code
      const inviteRef = doc(db, 'invites', inviteCode.toUpperCase().trim());
      const inviteSnap = await getDoc(inviteRef);
      
      let referredBy = '';
      if (inviteSnap.exists()) {
        const inviteData = inviteSnap.data();
        
        if (!inviteData.active) {
          setError('Este código de convite está inativo.');
          setLoading(false);
          return;
        }

        if (inviteData.maxUses && inviteData.usesCount >= inviteData.maxUses) {
          setError('Este código de convite atingiu o limite de usos.');
          setLoading(false);
          return;
        }

        if (inviteData.expiresAt) {
          const expiry = inviteData.expiresAt.toDate ? inviteData.expiresAt.toDate() : new Date(inviteData.expiresAt);
          if (expiry < new Date()) {
            setError('Este código de convite expirou.');
            setLoading(false);
            return;
          }
        }

        referredBy = inviteData.userId || '';
        // Increment use count
        await updateDoc(inviteRef, { usesCount: increment(1) });
      } else if (inviteCode.toUpperCase().trim() !== 'STUDIO50') {
        setError('Código de convite inválido.');
        setLoading(false);
        return;
      }

      // 2. Create profile
      const newProfile: UserProfile = {
        uid: user.uid,
        phone: user.phoneNumber || '',
        name: 'Membro VIP',
        role: UserRole.USER,
        inviteCode: `INK-${user.uid.slice(0, 4).toUpperCase()}`,
        referredBy,
        tier: UserTier.BRONZE,
        creditsBalance: 0,
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, 'users', user.uid), newProfile);
      
      // 3. Register invite code for this user
      await setDoc(doc(db, 'invites', newProfile.inviteCode), {
        code: newProfile.inviteCode,
        userId: user.uid
      });

      // 4. Notify the referrer
      if (referredBy) {
        try {
          await addDoc(collection(db, 'notifications'), {
            userId: referredBy,
            type: NotificationType.NEW_REFERRAL,
            title: 'Novo indicado! 👀',
            message: 'Alguém acabou de entrar no clube usando seu código.',
            createdAt: serverTimestamp(),
            read: false
          });
        } catch (notifErr) {
          console.error('Error sending referral notification:', notifErr);
          // Don't fail the sign up if notification fails
        }
      }

      localStorage.removeItem('inviteCode');
      navigate('/terms');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'users/profile');
      setError('Ocorreu um erro ao criar perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background font-sans min-h-screen">
      <header className="bg-zinc-950/80 backdrop-blur-xl border-b border-white/10 w-full px-6 py-4 sticky top-0 z-50 flex justify-between items-center shadow-[0_0_20px_rgba(204,255,0,0.05)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-primary-fixed/30">
            <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
               <UserPlus className="text-primary-fixed w-5 h-5" />
            </div>
          </div>
          <div className="text-xl font-bold font-headline tracking-widest text-primary-fixed">INK CIRCLE</div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 pt-12 pb-32">
        <div className="flex flex-col items-center mb-10">
          <div className="relative">
            <div className="absolute inset-0 bg-primary-fixed/20 blur-3xl rounded-full"></div>
            <div className="relative w-24 h-24 flex items-center justify-center glass-panel rounded-full border-primary-fixed/40">
              <Star className="text-primary-fixed w-12 h-12 fill-primary-fixed" />
            </div>
          </div>
        </div>

        <div className="text-center space-y-4 mb-12">
          <h1 className="font-headline text-4xl text-primary tracking-tighter leading-tight">
            Indique amigos. <br/>
            <span className="text-primary-fixed">Ganhe créditos para suas tattoos.</span>
          </h1>
          <p className="font-sans text-lg text-on-surface-variant max-w-xs mx-auto">
            Seus amigos tatuam e você acumula créditos para usar no estúdio.
          </p>
        </div>

        <div className="relative glass-panel rounded-xl p-8 mb-12 overflow-hidden neon-glow">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-secondary-container/10 blur-3xl rounded-full"></div>
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-primary-fixed/10 blur-3xl rounded-full"></div>
          
          <div className="relative z-10 flex flex-col items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full glass-panel flex items-center justify-center">
                 <UserPlus className="w-6 h-6 text-on-surface" />
              </div>
              <div className="h-px w-8 bg-gradient-to-r from-primary-fixed/50 to-secondary-container/50"></div>
              <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center neon-glow">
                <Star className="w-8 h-8 text-black fill-black" />
              </div>
              <div className="h-px w-8 bg-gradient-to-r from-secondary-container/50 to-primary-fixed/50"></div>
              <div className="w-12 h-12 rounded-full glass-panel flex items-center justify-center">
                 <Star className="w-6 h-6 text-on-surface" />
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-tertiary-fixed-dim/20 text-tertiary-fixed-dim font-headline text-[10px] tracking-widest border border-tertiary-fixed-dim/30">
              RECOMPENSAS EXCLUSIVAS
            </span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <label className="block text-primary-fixed font-headline text-[12px] mb-2 tracking-widest uppercase">
              Código de convite
            </label>
            <div className="relative">
              <input 
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="w-full bg-surface-container-high border-outline-variant focus:border-primary-fixed focus:ring-1 focus:ring-primary-fixed rounded-lg h-14 px-5 text-on-surface placeholder:text-zinc-600 transition-all font-sans uppercase tracking-widest text-center"
                placeholder="Ex: STUDIO50"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600">
                <Lock className="w-5 h-5" />
              </div>
            </div>
            <p className="text-primary-fixed/60 text-[10px] font-headline uppercase mt-2">
              Dica: Use o código <span className="text-primary-fixed font-black">STUDIO50</span> para testar agora.
            </p>
            {error && <p className="text-red-400 text-xs mt-2 uppercase font-headline tracking-wider">{error}</p>}
            <p className="text-center text-zinc-500 font-headline text-[10px] tracking-widest mt-2 uppercase">
              O app é exclusivo por convite.
            </p>
          </div>

          <button 
            onClick={handleEnter}
            disabled={loading}
            className="w-full h-14 bg-primary-fixed text-black font-headline text-xl rounded-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-all neon-glow disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar no clube'}
            {!loading && <ArrowRight className="w-6 h-6" />}
          </button>
        </div>
      </main>

      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-primary-fixed/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-secondary-container/5 blur-[120px] rounded-full"></div>
      </div>
    </div>
  );
}
