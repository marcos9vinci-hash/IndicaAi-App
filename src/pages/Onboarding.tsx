import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Users, 
  CreditCard, 
  Trophy, 
  Ticket, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const steps = [
  {
    title: "Bem-vindo ao Clube VIP",
    description: "Você agora faz parte de um ecossistema exclusivo de tatuagem e recompensas.",
    icon: <Sparkles className="w-12 h-12 text-primary-fixed" />,
    color: "from-primary-fixed/20 to-transparent"
  },
  {
    title: "Indique e Ganhe",
    description: "Cada amigo que você indica e completa uma tattoo rende créditos automáticos para você.",
    icon: <Users className="w-12 h-12 text-blue-400" />,
    color: "from-blue-400/20 to-transparent"
  },
  {
    title: "Use seus Créditos",
    description: "Você pode abater até 50% do valor de qualquer tattoo usando seu saldo acumulado.",
    icon: <CreditCard className="w-12 h-12 text-purple-400" />,
    color: "from-purple-400/20 to-transparent"
  },
  {
    title: "Ranking e Prêmios",
    description: "Suba de Tier (Bronze ao Diamante) e desbloqueie recompensas como tattoos grátis e prioridade na agenda.",
    icon: <Trophy className="w-12 h-12 text-yellow-500" />,
    color: "from-yellow-500/20 to-transparent"
  },
  {
    title: "Convites Restritos",
    description: "O estúdio opera em modo fechado. Seus convites são valiosos, use com sabedoria!",
    icon: <Ticket className="w-12 h-12 text-red-400" />,
    color: "from-red-400/20 to-transparent"
  }
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setLoading(true);
      try {
        if (profile?.uid) {
          await updateDoc(doc(db, 'users', profile.uid), {
            onboardingCompleted: true
          });
          await refreshProfile();
          navigate('/');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const step = steps[currentStep];

  return (
    <div className="bg-background text-on-surface font-sans min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentStep}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`absolute inset-0 bg-gradient-to-b ${step.color} z-0`}
        />
      </AnimatePresence>

      <div className="relative z-10 w-full max-w-sm space-y-12">
        {/* Progress Dots */}
        <div className="flex justify-center gap-2">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-1 rounded-full transition-all duration-500 ${i === currentStep ? 'w-8 bg-primary-fixed' : 'w-2 bg-white/10'}`} 
            />
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="text-center space-y-8"
          >
            <div className="flex justify-center">
              <div className="p-8 bg-black/40 backdrop-blur-3xl rounded-full border border-white/5 shadow-2xl relative group">
                <div className="absolute inset-0 bg-primary-fixed/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                {step.icon}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="font-headline text-3xl font-black text-white uppercase tracking-tight leading-tight">
                {step.title}
              </h2>
              <p className="text-on-surface-variant font-medium text-lg leading-relaxed">
                {step.description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Footer Actions */}
        <div className="flex gap-4">
          {currentStep > 0 && (
            <button 
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="flex-1 h-16 rounded-2xl border border-white/10 text-zinc-400 flex items-center justify-center hover:bg-white/5 transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <button 
            onClick={handleNext}
            disabled={loading}
            className="flex-[2] bg-primary-fixed text-black h-16 rounded-2xl font-headline font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-2xl shadow-primary-fixed/20 active:scale-95 transition-all"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {currentStep === steps.length - 1 ? 'Começar Agora' : 'Próximo'}
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Decorative Text */}
      <div className="absolute bottom-8 text-[10px] font-headline text-zinc-700 uppercase tracking-[0.3em] font-black">
        Estúdio Privado • Beta V.1.0
      </div>
    </div>
  );
}
