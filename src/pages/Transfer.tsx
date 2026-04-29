import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Search, Info, Gift, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { creditService } from '../lib/creditService';

export default function Transfer() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fee = Number(amount) * 0.05;
  const receiveAmount = Number(amount) - fee;

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setLoading(true);
    setError(null);

    try {
      await creditService.transferCredits(profile.uid, phone, Number(amount));
      setSuccess(true);
      setTimeout(() => navigate('/'), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar transferência');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }} 
          className="w-24 h-24 bg-primary-fixed/20 rounded-full flex items-center justify-center mb-6"
        >
          <CheckCircle2 className="w-12 h-12 text-primary-fixed" />
        </motion.div>
        <h1 className="text-3xl font-headline font-black text-white mb-2">TRANSFERÊNCIA REALIZADA!</h1>
        <p className="text-zinc-500 mb-8">Seu amigo receberá os créditos em instantes.</p>
        <div className="glass-panel p-6 rounded-xl w-full max-w-xs mb-8">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Valor Enviado</p>
          <p className="text-2xl font-headline text-primary-fixed font-black">R$ {Number(amount).toFixed(2)}</p>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="text-primary-fixed font-headline text-xs uppercase tracking-widest border-b border-primary-fixed pb-1"
        >
          Voltar para Início
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface pb-10">
      <header className="px-6 py-8 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-full text-zinc-400">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-headline font-black text-white uppercase tracking-widest">Doar Créditos</h1>
      </header>

      <main className="px-6 max-w-lg mx-auto space-y-8">
        {/* Balance Preview */}
        <div className="glass-panel p-6 rounded-2xl border-white/5 bg-gradient-to-br from-zinc-900 to-zinc-950">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Seu Saldo Disponível</p>
          <p className="text-3xl font-headline text-white font-black">R$ {profile?.creditsBalance || 0},00</p>
        </div>

        <form onSubmit={handleTransfer} className="space-y-6">
          {/* Recipient */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-headline ml-1">Para quem? (Telefone)</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
              <input 
                type="tel"
                placeholder="Ex: 11999999999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-primary-fixed transition-colors"
                required
              />
            </div>
            <p className="text-[9px] text-zinc-600 italic">*Digite apenas os números com DDD</p>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-headline ml-1">Quanto deseja doar?</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-fixed font-bold">R$</span>
              <input 
                type="number"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="5"
                max="100"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white text-xl font-headline focus:outline-none focus:border-primary-fixed transition-colors"
                required
              />
            </div>
            <div className="flex justify-between text-[10px] font-headline uppercase tracking-tighter px-1">
              <span className="text-zinc-600">Min: R$5</span>
              <span className="text-zinc-600">Max Diário: R$100</span>
            </div>
          </div>

          {/* Fee Breakdown */}
          <AnimatePresence>
            {Number(amount) >= 5 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-primary-fixed/5 rounded-xl p-4 border border-primary-fixed/10 space-y-2"
              >
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Taxa de Manutenção (5%)</span>
                  <span className="text-red-400">- R$ {fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-white/5">
                  <span className="text-white">Amigo Recebe</span>
                  <span className="text-primary-fixed">R$ {receiveAmount.toFixed(2)}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-xs text-center font-bold">
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading || !amount || !phone}
            className="w-full bg-primary-fixed text-black font-headline font-black py-5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale transition-all active:scale-95 shadow-lg shadow-primary-fixed/20"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
            ) : (
              <>
                <Send className="w-5 h-5" />
                DOAR AGORA
              </>
            )}
          </button>
        </form>

        <div className="flex gap-4 p-4 bg-zinc-900/50 rounded-xl border border-white/5">
          <Info className="w-10 h-10 text-zinc-600 flex-shrink-0" />
          <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">
            Ao doar créditos, você está presenteando um amigo com saldo para tatuar. 
            Lembre-se que esta operação é irreversível e possui uma taxa de rede de 5%.
          </p>
        </div>
      </main>
    </div>
  );
}
