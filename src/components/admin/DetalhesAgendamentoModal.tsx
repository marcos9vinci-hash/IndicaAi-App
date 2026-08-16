import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, FileText, Calendar, Clock, DollarSign, Palette, Trash2, Send, Settings, CheckCircle2, Loader2, AlertTriangle, List } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { Booking, BookingStatus, StudioSettings } from '../../types';

interface DetalhesAgendamentoModalProps {
  agendamento: Booking | null;
  settings?: StudioSettings;
  onClose: () => void;
  onEdit?: (agendamento: Booking) => void;
  onStatusChange?: () => void; // Trigger to refresh data
}

const STATUS_COLORS = {
  [BookingStatus.APPROVED]: "bg-blue-500",
  [BookingStatus.DEPOSIT_PAID]: "bg-green-500",
  [BookingStatus.PENDING_APPROVAL]: "bg-yellow-500",
  [BookingStatus.COMPLETED]: "bg-gray-400",
  [BookingStatus.REJECTED]: "bg-red-500",
  [BookingStatus.RESCHEDULED]: "bg-orange-500",
  [BookingStatus.DEPOSIT_PENDING]: "bg-orange-300",
  [BookingStatus.NO_SHOW]: "bg-red-700",
};

const statusOptions = [
  { value: BookingStatus.APPROVED, label: 'Aprovado', icon: Calendar },
  { value: BookingStatus.DEPOSIT_PAID, label: 'Sinal Pago', icon: CheckCircle2 },
  { value: BookingStatus.PENDING_APPROVAL, label: 'Pendente', icon: Loader2 },
  { value: BookingStatus.COMPLETED, label: 'Concluído', icon: CheckCircle2, color: 'text-green-500' },
  { value: BookingStatus.REJECTED, label: 'Recusado', icon: AlertTriangle },
  { value: BookingStatus.RESCHEDULED, label: 'Reagendado', icon: List }
];

const MESSAGE_TYPES = [
  { key: 'confirmacao', label: '✅ Confirmação' },
  { key: 'lembrete', label: '🔔 Lembrete' },
  { key: 'followup', label: '💬 Follow-up' }
];

export default function DetalhesAgendamentoModal({
  agendamento,
  settings,
  onClose,
  onEdit,
  onStatusChange
}: DetalhesAgendamentoModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMsgSelector, setShowMsgSelector] = useState(false);
  const [clientPhone, setClientPhone] = useState<string | null>(agendamento?.userPhone || null);

  useEffect(() => {
    if (agendamento) {
      setClientPhone(agendamento.userPhone || null);

      // Se não tiver o telefone no agendamento, tenta buscar no cadastro do usuário
      if (!agendamento.userPhone && agendamento.userId) {
        const fetchPhone = async () => {
          try {
            const userSnap = await getDoc(doc(db, 'users', agendamento.userId));
            if (userSnap.exists()) {
              const phone = userSnap.data().phone;
              if (phone) setClientPhone(phone);
            }
          } catch (err) {
            console.error("Erro ao buscar telefone do cliente:", err);
          }
        };
        fetchPhone();
      }
    }
  }, [agendamento]);

  if (!agendamento) return null;

  const hasImages = agendamento.fotos_referencia && agendamento.fotos_referencia.length > 0;

  const nextImage = () => {
    if (agendamento.fotos_referencia) {
      setCurrentImageIndex((prev) => (prev + 1) % agendamento.fotos_referencia!.length);
    }
  };

  const prevImage = () => {
    if (agendamento.fotos_referencia) {
      setCurrentImageIndex((prev) => (prev - 1 + agendamento.fotos_referencia!.length) % agendamento.fotos_referencia!.length);
    }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as BookingStatus;
    try {
      await updateDoc(doc(db, 'bookings', agendamento.id), { status: newStatus });
      onStatusChange?.();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Deseja realmente excluir este agendamento?")) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'bookings', agendamento.id));
      onStatusChange?.();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSendWhatsApp = (msgKey: string) => {
    let phone = clientPhone;

    if (!phone) {
      phone = prompt("Digite o WhatsApp do cliente (Ex: 11999999999):");
    }

    if (!phone) return;
    
    // Limpar o número de telefone
    phone = phone.replace(/\D/g, '');
    if (!phone.startsWith('55') && phone.length <= 11) {
      phone = `55${phone}`;
    }

    const templates = settings?.whatsappTemplates || {};
    const template = templates[msgKey as keyof typeof templates] ||
      (msgKey === 'confirmacao' ? "Olá {cliente}, seu horário no dia {data} às {horario} está confirmado!" :
       msgKey === 'lembrete' ? "Oi {cliente}, passando para lembrar da sua tattoo amanhã às {horario}!" :
       "Olá {cliente}, como está a cicatrização da sua tattoo?");
    
    // Substituir variáveis
    let text = template
      .replace(/{cliente}/g, agendamento.userName || 'Cliente')
      .replace(/{data}/g, format(new Date(`${agendamento.date}T12:00:00`), 'dd/MM/yyyy'))
      .replace(/{horario}/g, agendamento.time)
      .replace(/{servico}/g, agendamento.descricao_servico || 'tatuagem')
      .replace(/{profissional}/g, agendamento.artistId || 'nosso profissional');

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    setShowMsgSelector(false);
  };

  // Seletor de tipo de mensagem
  if (showMsgSelector) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
        <h2 className="text-xl font-bold text-white mb-4 uppercase font-headline">Qual mensagem enviar?</h2>
        <div className="space-y-2 py-2">
          {MESSAGE_TYPES.map(m => (
            <button 
              key={m.key} 
              className="w-full text-left px-4 py-3 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-white"
              onClick={() => handleSendWhatsApp(m.key)}
            >
              {m.label}
            </button>
          ))}
          <button 
            className="w-full text-center px-4 py-3 rounded-lg text-zinc-400 hover:text-white transition-colors mt-2"
            onClick={() => setShowMsgSelector(false)}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-zinc-950 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl relative flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Imagem de referência */}
        <div className="relative">
          {hasImages ? (
            <>
              <img src={agendamento.fotos_referencia![currentImageIndex]} alt="Referência" className="w-full h-64 object-cover" />
              {agendamento.fotos_referencia!.length > 1 && (
                <>
                  <button className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1" onClick={prevImage}><ChevronLeft className="w-5 h-5"/></button>
                  <button className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1" onClick={nextImage}><ChevronRight className="w-5 h-5"/></button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[10px] px-2 py-1 rounded-full font-headline">{currentImageIndex + 1} / {agendamento.fotos_referencia!.length}</div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-40 bg-zinc-900 flex items-center justify-center border-b border-white/5">
              <FileText className="w-12 h-12 text-zinc-700" />
            </div>
          )}
          <button className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5" onClick={onClose}><X className="w-4 h-4"/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-white uppercase font-headline tracking-wide">{agendamento.userName || 'Sem nome'}</h3>
              <p className="text-sm text-zinc-400">{agendamento.descricao_servico || 'Sem descrição'}</p>
            </div>
            <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-1 border border-white/5">
              <button className="p-2 hover:bg-zinc-800 rounded-md transition-colors group" onClick={() => setShowMsgSelector(true)} title="Enviar via WhatsApp">
                <Send className="w-4 h-4 text-green-500 group-hover:scale-110 transition-transform" />
              </button>
              {onEdit && (
                <button className="p-2 hover:bg-zinc-800 rounded-md transition-colors" onClick={() => onEdit(agendamento)} title="Editar">
                  <Settings className="w-4 h-4 text-zinc-400" />
                </button>
              )}
              <button className="p-2 hover:bg-zinc-800 rounded-md transition-colors" onClick={handleDelete} disabled={isDeleting} title="Excluir">
                {isDeleting ? <Loader2 className="w-4 h-4 text-red-500 animate-spin"/> : <Trash2 className="w-4 h-4 text-red-500 hover:text-red-400" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 bg-zinc-900 border border-white/5 p-2.5 rounded-xl">
              <Calendar className="w-4 h-4 text-primary-fixed"/>
              <span className="text-zinc-300 font-medium">{format(new Date(`${agendamento.date}T12:00:00`), "dd/MM/yyyy", { locale: ptBR })}</span>
            </div>
            <div className="flex items-center gap-2 bg-zinc-900 border border-white/5 p-2.5 rounded-xl">
              <Clock className="w-4 h-4 text-primary-fixed"/>
              <span className="text-zinc-300 font-medium">{agendamento.time}</span>
            </div>
            <div className="flex items-center gap-2 bg-zinc-900 border border-white/5 p-2.5 rounded-xl">
              <DollarSign className="w-4 h-4 text-green-500"/>
              <span className="text-zinc-300 font-medium">R$ {(agendamento.priceEstimated || 0).toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2 bg-zinc-900 border border-white/5 p-2.5 rounded-xl">
              <Palette className="w-4 h-4 text-primary-fixed"/>
              <span className="text-zinc-300 font-medium truncate">{agendamento.artistId || 'Estúdio'}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Status do Agendamento</label>
            <select 
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary-fixed appearance-none"
              value={agendamento.status} 
              onChange={handleStatusChange}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {(agendamento.regiao_corpo || agendamento.estilo) && (
             <div className="bg-zinc-900 border border-white/5 p-3.5 rounded-xl flex justify-between">
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-headline">Região</p>
                  <p className="text-sm text-zinc-300">{agendamento.regiao_corpo || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-headline">Estilo</p>
                  <p className="text-sm text-zinc-300">{agendamento.estilo || '-'}</p>
                </div>
             </div>
          )}
          
          {agendamento.observacoes && (
            <div className="bg-zinc-900/50 border border-white/5 p-3.5 rounded-xl">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-headline mb-1">Observações:</p>
              <p className="text-sm text-zinc-300">{agendamento.observacoes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
