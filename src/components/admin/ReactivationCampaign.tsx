import { useState } from "react";
import { X, Send, ChevronRight, MessageSquare, Users } from "lucide-react";
import { UserProfile } from "../../types";

interface Props {
  users: UserProfile[];
  onClose: () => void;
  days: number;
}

export default function ReactivationCampaign({ users, onClose, days }: Props) {
  const [index, setIndex] = useState(0);

  if (!users.length) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
        <div className="glass-panel p-8 rounded-3xl border border-white/10 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-primary-fixed/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-primary-fixed" />
          </div>
          <h2 className="text-xl font-headline text-white mb-2">Nenhum cliente nesse alvo! 🎉</h2>
          <p className="text-zinc-500 text-sm mb-6 uppercase tracking-widest">Sua base está engajada neste segmento.</p>
          <button 
            onClick={onClose} 
            className="w-full py-4 bg-primary-fixed text-black font-headline uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  const currentUser = users[index];

  const getCampaignMessage = (name: string, code: string, daysIn: number) => {
    const firstName = name.split(' ')[0];
    const baseUrl = `https://indica-ai-app.netlify.app?ref=${code}`;
    
    if (daysIn <= 7) {
      return `💉 Ei ${firstName}! Faz uns dias que você não entra no Clube VIP 👀\n\nVocê ainda tem benefícios te esperando! Dá uma olhada no que tem de novo:\n\n👉 ${baseUrl}\n\nSeu código: ${code}`;
    }
    if (daysIn <= 14) {
      return `💰 Temos créditos esperando por você, ${firstName}!\n\nVolta pro Clube VIP e aproveita pra acumular saldo na sua próxima tattoo. Não deixa parado!\n\n👉 ${baseUrl}\n\nSeu código: ${code}`;
    }
    if (daysIn <= 30) {
      return `Sentimos sua falta no estúdio, ${firstName} 🖤\n\nO Clube VIP está bombando e você está perdendo os bônus de indicação. Bora marcar a próxima?\n\n👉 ${baseUrl}\n\nSeu código: ${code}`;
    }
    return `⚠️ Última chamada para não perder seus benefícios, ${firstName}!\n\nVolte antes que seus créditos expirem ou sua conta fique inativa no Clube VIP.\n\n👉 ${baseUrl}\n\nSeu código: ${code}`;
  };

  const message = getCampaignMessage(currentUser.name, currentUser.inviteCode, days);

  const encodedMessage = encodeURIComponent(message);

  const openWhatsApp = () => {
    const phone = currentUser.phone.replace(/\D/g, "");
    const url = `https://wa.me/${phone}?text=${encodedMessage}`;
    window.open(url, "_blank");
  };

  const nextUser = () => {
    if (index < users.length - 1) {
      setIndex(index + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
      <div className="glass-panel p-6 md:p-8 rounded-[32px] border border-white/10 max-w-md w-full relative overflow-hidden">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
          <div 
            className="h-full bg-primary-fixed transition-all duration-500" 
            style={{ width: `${((index + 1) / users.length) * 100}%` }}
          />
        </div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary-fixed rounded-xl flex items-center justify-center text-black">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-headline text-white uppercase tracking-wider">Assistente VIP</h2>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-headline">
              Cliente {index + 1} de {users.length}
            </p>
          </div>
        </div>

        {/* User Card */}
        <div className="bg-black/40 rounded-2xl p-5 border border-white/5 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-headline mb-1">Nome do Cliente</p>
              <h3 className="text-white font-headline uppercase">{currentUser.name}</h3>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-zinc-500 uppercase font-headline mb-1">Código</p>
              <span className="bg-primary-fixed/20 text-primary-fixed px-2 py-0.5 rounded text-[10px] font-black">{currentUser.inviteCode}</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase font-headline mb-1">Telefone</p>
            <p className="text-sm text-zinc-300 font-mono tracking-tighter">{currentUser.phone}</p>
          </div>
        </div>

        {/* Message Preview */}
        <div className="mb-8">
          <p className="text-[10px] text-zinc-500 uppercase font-headline mb-2 flex items-center gap-2">
            Prévia da Mensagem
          </p>
          <div className="bg-zinc-900/50 rounded-2xl p-4 border border-white/5 text-xs text-zinc-400 font-sans leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
            {message}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={openWhatsApp}
            className="w-full py-4 bg-[#25D366] text-black font-headline uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[#25D366]/20"
          >
            <Send className="w-4 h-4" />
            Abrir WhatsApp
          </button>

          <button
            onClick={nextUser}
            className="w-full py-4 bg-zinc-800 text-white font-headline uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-700 transition-all"
          >
            {index < users.length - 1 ? 'Próximo Cliente' : 'Finalizar Campanha'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
