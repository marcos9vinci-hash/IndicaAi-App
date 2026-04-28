import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Search, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  runTransaction, 
  doc, 
  serverTimestamp,
  addDoc 
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { TransactionType, OperationType } from '../types';
import { handleFirestoreError } from '../lib/error-handler';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TransferModal({ isOpen, onClose }: TransferModalProps) {
  const { profile, refreshProfile } = useAuth();
  const [step, setStep] = useState<'search' | 'amount' | 'success'>('search');
  const [searchPhone, setSearchPhone] = useState('');
  const [recipient, setRecipient] = useState<{ uid: string; name: string; phone: string } | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!searchPhone) return;
    setLoading(true);
    setError('');
    
    try {
      const formattedPhone = searchPhone.startsWith('+') ? searchPhone : `+55${searchPhone.replace(/\D/g, '')}`;
      
      if (formattedPhone === profile?.phone) {
        throw new Error('Você não pode transferir para si mesmo.');
      }

      const q = query(collection(db, 'users'), where('phone', '==', formattedPhone));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('Usuário não encontrado. Verifique o número.');
      }

      const userData = querySnapshot.docs[0].data();
      setRecipient({
        uid: querySnapshot.docs[0].id,
        name: userData.name || 'Usuário',
        phone: userData.phone
      });
      setStep('amount');
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar usuário.');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    const value = parseInt(amount);
    if (isNaN(value) || value <= 0) {
      setError('Insira um valor válido.');
      return;
    }

    if (profile && profile.creditsBalance < value) {
      setError('Saldo insuficiente.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const senderRef = doc(db, 'users', profile!.uid);
      const recipientRef = doc(db, 'users', recipient!.uid);
      const transactionsRef = collection(db, 'transactions');

      await runTransaction(db, async (transaction) => {
        const senderDoc = await transaction.get(senderRef);
        const recipientDoc = await transaction.get(recipientRef);

        if (!senderDoc.exists() || !recipientDoc.exists()) {
          throw new Error('Erro na transação: Contas inválidas.');
        }

        const newSenderBalance = senderDoc.data().creditsBalance - value;
        const newRecipientBalance = recipientDoc.data().creditsBalance + value;

        if (newSenderBalance < 0) {
          throw new Error('Saldo insuficiente detectado na transação.');
        }

        // Update balances
        transaction.update(senderRef, { creditsBalance: newSenderBalance });
        transaction.update(recipientRef, { creditsBalance: newRecipientBalance });

        // Add records (Note: transactions inside runTransaction can't use addDoc directly easily in some versions, but setDoc is fine or just add them outside if atomicity on balance is enough)
        // Better: use doc(collection()) to pre-generate IDs then set within transaction
        const t1Ref = doc(transactionsRef);
        const t2Ref = doc(transactionsRef);

        transaction.set(t1Ref, {
          userId: profile!.uid,
          amount: -value,
          type: TransactionType.TRANSFER_SEND,
          description: `Transferência para ${recipient?.name}`,
          targetPhone: recipient?.phone,
          createdAt: serverTimestamp()
        });

        transaction.set(t2Ref, {
          userId: recipient!.uid,
          amount: value,
          type: TransactionType.TRANSFER_RECEIVE,
          description: `Recebido de ${profile?.name || 'Amigo'}`,
          sourcePhone: profile?.phone,
          createdAt: serverTimestamp()
        });
      });

      await refreshProfile();
      setStep('success');
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, 'transactions');
      setError('Falha na transferência. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('search');
    setSearchPhone('');
    setRecipient(null);
    setAmount('');
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={reset}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-sm glass-panel p-6 rounded-2xl relative z-10 border-primary-fixed/20 shadow-2xl shadow-primary-fixed/5"
          >
            <button 
              onClick={reset}
              className="absolute right-4 top-4 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {step === 'search' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary-fixed/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="w-8 h-8 text-primary-fixed" />
                  </div>
                  <h3 className="font-headline text-xl text-white uppercase tracking-wider">Transferir Crédito</h3>
                  <p className="text-zinc-500 text-sm mt-1">Envie créditos para outro membro</p>
                </div>

                <div className="space-y-3">
                  <label className="font-headline text-[10px] text-zinc-500 uppercase tracking-widest pl-1">Celular do destinatário</label>
                  <div className="relative">
                    <input 
                      type="tel" 
                      placeholder="(00) 00000-0000"
                      value={searchPhone}
                      onChange={(e) => setSearchPhone(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl h-14 pl-12 pr-4 text-white focus:border-primary-fixed transition-colors outline-none"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                  </div>
                  {error && <p className="text-red-400 text-xs pl-1">{error}</p>}
                </div>

                <button 
                  onClick={handleSearch}
                  disabled={loading || searchPhone.length < 8}
                  className="w-full bg-primary-fixed text-black h-12 rounded-xl font-headline font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:bg-primary-fixed-dim"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Próximo'}
                </button>
              </div>
            )}

            {step === 'amount' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                    <div className="text-primary-fixed font-black">{recipient?.name.charAt(0)}</div>
                  </div>
                  <h3 className="font-headline text-lg text-white">{recipient?.name}</h3>
                  <p className="text-zinc-500 text-[10px] uppercase tracking-widest">{recipient?.phone}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <label className="font-headline text-[10px] text-zinc-500 uppercase tracking-widest">Quanto enviar?</label>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-headline">Saldo: R${profile?.creditsBalance}</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-fixed font-headline text-xl font-black">R$</span>
                    <input 
                      type="number" 
                      placeholder="0,00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl h-16 pl-12 pr-4 text-3xl font-headline font-black text-white focus:border-primary-fixed transition-colors outline-none"
                    />
                  </div>
                  {error && <p className="text-red-400 text-xs pl-1">{error}</p>}
                </div>

                <div className="flex flex-col gap-2">
                  <button 
                    onClick={handleTransfer}
                    disabled={loading || !amount}
                    className="w-full bg-primary-fixed text-black h-12 rounded-xl font-headline font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:bg-primary-fixed-dim"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar Envio'}
                  </button>
                  <button 
                    onClick={() => setStep('search')}
                    className="w-full h-10 text-zinc-500 text-xs font-headline uppercase tracking-widest"
                  >
                    Voltar
                  </button>
                </div>
              </div>
            )}

            {step === 'success' && (
              <div className="py-8 text-center space-y-6">
                <div className="w-20 h-20 bg-primary-fixed/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-12 h-12 text-primary-fixed" />
                </div>
                <div>
                  <h3 className="font-headline text-2xl text-white uppercase tracking-wider">Transferido!</h3>
                  <p className="text-zinc-500 text-sm mt-1">Seus créditos foram enviados com sucesso.</p>
                </div>
                <div className="glass-panel p-4 rounded-xl bg-primary-fixed/5 border-primary-fixed/10">
                  <p className="text-primary-fixed font-headline text-2xl font-black tracking-tighter">R$ {amount},00</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-headline mt-1">Para {recipient?.name}</p>
                </div>
                <button 
                  onClick={reset}
                  className="w-full bg-zinc-800 text-white h-12 rounded-xl font-headline font-black uppercase tracking-widest transition-all hover:bg-zinc-700"
                >
                  Fechar
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
