import React, { useState, useEffect } from 'react';
import { X, UserPlus, ChevronUp, ChevronDown, Upload, FileText } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, addDoc, getDocs, serverTimestamp, query, where } from 'firebase/firestore';
import { cn } from '../../lib/utils';
import { BookingStatus } from '../../types';
import { cloudBotService } from '../../lib/cloudBotService';

interface NovoAgendamentoWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDate?: Date | null;
  initialTime?: string | null;
}

export default function NovoAgendamentoWizard({
  isOpen,
  onClose,
  onSuccess,
  initialDate,
  initialTime
}: NovoAgendamentoWizardProps) {
  const [form, setForm] = useState({
    cliente_id: '',
    profissional_id: '',
    data_agendamento: '',
    descricao_servico: '',
    valor_estimado: '',
    valor_sinal: '',
    estilo: '',
    primeira_tatuagem: false,
    regiao_corpo: '',
    fotos_referencia: [] as string[]
  });

  const [clientesLocais, setClientesLocais] = useState<any[]>([]);
  const [showNovoCliente, setShowNovoCliente] = useState(false);
  const [novoCliente, setNovoCliente] = useState({ nome: '', telefone: '', email: '', instagram: '' });
  const [criandoCliente, setCriandoCliente] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'user'));
        const snap = await getDocs(q);
        setClientesLocais(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("Erro ao buscar clientes:", error);
      }
    };

    if (isOpen) {
      fetchClientes();
      const dateStr = initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      const timeStr = initialTime || '10:00';
      setForm(f => ({ ...f, data_agendamento: `${dateStr}T${timeStr}` }));
    }
  }, [isOpen, initialDate, initialTime]);

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const dataParte = form.data_agendamento ? form.data_agendamento.slice(0, 10) : "";
  const horaParte = form.data_agendamento ? form.data_agendamento.slice(11, 16) : "";

  const handleDataChange = (novaData: string) => {
    if (!novaData) return;
    const hora = horaParte || "09:00";
    handleChange("data_agendamento", `${novaData}T${hora}`);
  };

  const handleHoraChange = (novaHora: string) => {
    if (!novaHora) return;
    const data = dataParte || new Date().toISOString().slice(0, 10);
    handleChange("data_agendamento", `${data}T${novaHora}`);
  };

  // Adaptação: Convertendo imagem para Base64 (temporário até Firebase Storage)
  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    
    setUploadingImg(true);
    
    const readAsDataURL = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    try {
      const urls = await Promise.all(files.map(f => readAsDataURL(f)));
      setForm(prev => ({ ...prev, fotos_referencia: [...(prev.fotos_referencia || []), ...urls] }));
    } catch (err) {
      console.error("Erro no upload", err);
    } finally {
      setUploadingImg(false);
      e.target.value = "";
    }
  };

  const handleRemoverFoto = (idx: number) => {
    setForm(prev => ({ ...prev, fotos_referencia: prev.fotos_referencia.filter((_, i) => i !== idx) }));
  };

  const handleCriarCliente = async () => {
    if (!novoCliente.nome.trim()) return;
    setCriandoCliente(true);
    try {
      const payload = {
        name: novoCliente.nome,
        phone: novoCliente.telefone,
        email: novoCliente.email,
        instagram: novoCliente.instagram,
        role: 'user',
        createdAt: serverTimestamp(),
        creditsBalance: 0,
        tier: 'Bronze',
        inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase()
      };
      const docRef = await addDoc(collection(db, 'users'), payload);
      const criado = { id: docRef.id, ...payload };
      setClientesLocais(prev => [...prev, criado]);
      setForm(prev => ({ ...prev, cliente_id: docRef.id }));
      setNovoCliente({ nome: "", telefone: "", email: "", instagram: "" });
      setShowNovoCliente(false);
    } catch (error) {
      console.error("Erro ao criar cliente:", error);
    } finally {
      setCriandoCliente(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cliente_id || !form.data_agendamento) return;
    setIsLoading(true);

    try {
      const selectedUser = clientesLocais.find(c => c.id === form.cliente_id);
      
      const payload = {
        userId: form.cliente_id,
        userName: selectedUser?.name || 'Cliente',
        userPhone: selectedUser?.phone || '',
        artistId: form.profissional_id || 'admin',
        date: dataParte,
        time: horaParte,
        size: 'Média', // default mapping
        priceEstimated: form.valor_estimado ? parseFloat(form.valor_estimado) : 0,
        depositPaid: form.valor_sinal ? parseFloat(form.valor_sinal) : 0,
        creditsUsed: 0,
        status: BookingStatus.APPROVED,
        createdAt: serverTimestamp(),
        // Extra fields
        fotos_referencia: form.fotos_referencia,
        descricao_servico: form.descricao_servico,
        estilo: form.estilo,
        primeira_tatuagem: form.primeira_tatuagem,
        regiao_corpo: form.regiao_corpo
      };

      await addDoc(collection(db, 'bookings'), payload);
      alert("Agendamento realizado com sucesso!");

      // ACORDA O ROBÔ NA NUVEM NA HORA
      cloudBotService.triggerBot();

      onSuccess();
    } catch (error) {
      console.error("Erro ao agendar:", error);
      alert("Erro ao salvar agendamento: " + (error as any).message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative my-8">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-zinc-900 rounded-full p-1"
        >
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-bold text-white mb-6 uppercase font-headline tracking-wide">Novo Agendamento</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cliente */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-zinc-300">Cliente *</label>
              <button 
                type="button" 
                className="text-xs text-primary-fixed hover:text-primary-fixed/80 flex items-center gap-1"
                onClick={() => setShowNovoCliente(v => !v)}
              >
                <UserPlus className="w-3 h-3" />
                {showNovoCliente ? "Cancelar" : "Novo cliente"}
                {showNovoCliente ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
            
            {showNovoCliente ? (
              <div className="border border-white/10 rounded-xl p-4 space-y-3 bg-zinc-900/50">
                <p className="text-xs text-zinc-400 font-medium">Cadastrar novo cliente</p>
                <input 
                  className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary-fixed"
                  placeholder="Nome completo *" 
                  value={novoCliente.nome} 
                  onChange={e => setNovoCliente(p => ({ ...p, nome: e.target.value }))} 
                />
                <input 
                  className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary-fixed"
                  placeholder="WhatsApp (ex: 11999998888)" 
                  value={novoCliente.telefone} 
                  onChange={e => setNovoCliente(p => ({ ...p, telefone: e.target.value }))} 
                />
                <input 
                  className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary-fixed"
                  placeholder="Email" 
                  value={novoCliente.email} 
                  onChange={e => setNovoCliente(p => ({ ...p, email: e.target.value }))} 
                />
                <button 
                  type="button" 
                  className="w-full bg-primary-fixed text-black font-bold py-2 rounded-lg text-sm disabled:opacity-50"
                  onClick={handleCriarCliente} 
                  disabled={criandoCliente || !novoCliente.nome.trim()}
                >
                  {criandoCliente ? "Criando..." : "Criar e selecionar cliente"}
                </button>
              </div>
            ) : (
              <select 
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-fixed"
                value={form.cliente_id} 
                onChange={e => handleChange("cliente_id", e.target.value)} 
                required
              >
                <option value="" disabled>Selecione o cliente</option>
                {clientesLocais.map(c => (
                  <option key={c.id} value={c.id}>{c.name || c.telefone || 'Sem nome'}</option>
                ))}
              </select>
            )}
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-300">Data *</label>
              <input 
                type="date" 
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-fixed"
                value={dataParte} 
                onChange={e => handleDataChange(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-300">Hora *</label>
              <input 
                type="time" 
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-fixed"
                value={horaParte} 
                onChange={e => handleHoraChange(e.target.value)} 
                required 
              />
            </div>
          </div>

          {/* Serviço / Descrição */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-300">Descrição da Tatuagem</label>
            <textarea 
              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary-fixed min-h-[80px]"
              placeholder="Ex: Leão realista no antebraço..."
              value={form.descricao_servico} 
              onChange={e => handleChange("descricao_servico", e.target.value)} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-300">Região do Corpo</label>
              <input 
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-fixed"
                placeholder="Ex: Antebraço direito"
                value={form.regiao_corpo} 
                onChange={e => handleChange("regiao_corpo", e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-300">Estilo</label>
              <input 
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-fixed"
                placeholder="Ex: Realismo, Fineline"
                value={form.estilo} 
                onChange={e => handleChange("estilo", e.target.value)} 
              />
            </div>
          </div>

          {/* Valores */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-300">Valor Estimado (R$)</label>
              <input 
                type="number" 
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-fixed"
                placeholder="0.00"
                value={form.valor_estimado} 
                onChange={e => handleChange("valor_estimado", e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-300">Valor Sinal (R$)</label>
              <input 
                type="number" 
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-fixed"
                placeholder="0.00"
                value={form.valor_sinal} 
                onChange={e => handleChange("valor_sinal", e.target.value)} 
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer mt-2">
            <input 
              type="checkbox" 
              className="accent-primary-fixed w-4 h-4 rounded"
              checked={form.primeira_tatuagem} 
              onChange={e => handleChange("primeira_tatuagem", e.target.checked)} 
            />
            <span className="text-sm text-zinc-300">É a primeira tatuagem do cliente?</span>
          </label>

          {/* Fotos de Referência */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-300">Fotos de Referência</label>
            <div className="border-2 border-dashed border-white/10 rounded-xl p-4 text-center hover:bg-zinc-900/50 transition-colors">
              <input 
                type="file" 
                id="foto-upload" 
                className="hidden" 
                multiple 
                accept="image/*" 
                onChange={handleUploadFoto} 
              />
              <label htmlFor="foto-upload" className="cursor-pointer flex flex-col items-center gap-2">
                <Upload className="w-6 h-6 text-zinc-500" />
                <span className="text-sm text-zinc-400">
                  {uploadingImg ? "Processando imagens..." : "Clique para adicionar fotos"}
                </span>
              </label>
            </div>
            
            {form.fotos_referencia.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-3">
                {form.fotos_referencia.map((url, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10 group">
                    <img src={url} alt="ref" className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => handleRemoverFoto(i)}
                      className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="w-full bg-primary-fixed text-black font-bold py-3 rounded-xl uppercase tracking-widest disabled:opacity-50 hover:bg-primary-fixed/90 transition-colors"
            disabled={isLoading || !form.cliente_id || !form.data_agendamento}
          >
            {isLoading ? "Salvando..." : "Confirmar Agendamento"}
          </button>
        </form>
      </div>
    </div>
  );
}
