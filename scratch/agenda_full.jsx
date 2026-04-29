me de agora da agenda e calendario por favor

18 minutes ago


Revert
S1
Base44 AI
Base44

Vou ler os dois arquivos agora.

Leu
pages/Agendamentos
Leu
pages/Calendario
Aqui estão os dois arquivos completos e atuais:

pages/Agendamentos.jsx — 510 linhas
import React, { useState, useEffect } from "react";
import { Agendamento } from "@/entities/Agendamento";
import { Cliente } from "@/entities/Cliente";
import { Profissional } from "@/entities/Profissional";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Calendar, List, Grid, Sun, Moon, Clock } from "lucide-react";
import NovoAgendamentoWizard from "../components/agendamentos/NovoAgendamentoWizard";
import DetalhesAgendamentoModal from "../components/agendamentos/DetalhesAgendamentoModal";
import { useCurrentUser } from "../components/useCurrentUser";

const CalendarioSemanal = ({ dataAtual, agendamentos, clientes, onAgendamentoClick }) => {
  const inicioSemana = startOfWeek(dataAtual, { weekStartsOn: 1 });
  const fimSemana = endOfWeek(dataAtual, { weekStartsOn: 1 });
  const diasDaSemana = eachDayOfInterval({ start: inicioSemana, end: fimSemana });

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[800px] border border-border rounded-lg">
        <div className="grid grid-cols-8 bg-card">
          <div className="p-2 border-r border-border"></div>
          {diasDaSemana.map((dia) => (
            <div key={dia.toISOString()} className="text-center p-2 border-r border-border last:border-r-0">
              <div className={`font-medium text-xs uppercase ${isToday(dia) ? 'text-primary' : 'text-muted-foreground'}`}>
                {format(dia, 'EEE', { locale: ptBR })}
              </div>
              <div className={`text-2xl font-bold ${isToday(dia) ? 'text-primary' : 'text-foreground'}`}>
                {format(dia, 'd')}
              </div>
            </div>
          ))}
        </div>
        <div className="relative grid grid-cols-8">
          <div className="col-span-1 border-r border-border">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="h-12 text-xs text-muted-foreground text-right pr-2 border-t border-border flex items-center justify-end">
                {String(i + 8).padStart(2, '0')}:00
              </div>
            ))}
          </div>
          {diasDaSemana.map((dia) => (
            <div key={dia.toISOString()} className="col-span-1 relative border-r border-border last:border-r-0">
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={`line-${dia.toISOString()}-${i}`} className="absolute w-full h-12 border-t border-border" style={{ top: `${(i * 12) / (14 * 12) * 100}%` }}></div>
              ))}
              {agendamentos
                .filter(ag => isSameDay(new Date(ag.data_agendamento), dia))
                .map(ag => {
                  const cliente = clientes.find(c => c.id === ag.cliente_id);
                  const dataAgendamento = new Date(ag.data_agendamento);
                  const horaInicio = dataAgendamento.getHours();
                  const minutosInicio = dataAgendamento.getMinutes();
                  const startHourDisplay = 8;
                  const totalMinutesVisible = (21 - startHourDisplay) * 60;
                  const eventMinutesFromStart = (horaInicio - startHourDisplay) * 60 + minutosInicio;
                  const clampedEventMinutesFromStart = Math.max(0, eventMinutesFromStart);
                  const top = (clampedEventMinutesFromStart / totalMinutesVisible) * 100;
                  const eventHeightPx = 24;
                  const totalContainerHeightPx = 14 * 48;
                  const topPx = (top / 100) * totalContainerHeightPx;
                  return (
                    <div key={ag.id} onClick={() => onAgendamentoClick(ag)} className="absolute w-[calc(100%-2px)] p-0.5" style={{ top: `${topPx}px`, height: `${eventHeightPx}px` }}>
                      <div className="bg-primary/20 text-primary text-xs p-1 rounded hover:bg-primary/30 truncate h-full">
                        {format(new Date(ag.data_agendamento), 'HH:mm')} - {cliente?.nome?.split(' ')[0] || 'Cliente'}
                      </div>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ListaAgendamentos = ({ agendamentos, clientes, profissionais, onAgendamentoClick }) => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const agendamentosFuturos = agendamentos
    .filter(ag => new Date(ag.data_agendamento) >= hoje)
    .sort((a, b) => new Date(a.data_agendamento) - new Date(b.data_agendamento));

  return (
    <div className="space-y-4">
      {agendamentosFuturos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="w-8 h-8 mx-auto mb-2" />
          <p>Nenhum agendamento futuro encontrado.</p>
        </div>
      ) : (
        agendamentosFuturos.map((ag) => {
          const cliente = clientes.find(c => c.id === ag.cliente_id);
          const profissional = profissionais.find(p => p.id === ag.profissional_id);
          return (
            <Card key={ag.id} className="hover:shadow-md transition-all cursor-pointer" onClick={() => onAgendamentoClick(ag)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{cliente?.nome || 'Cliente'}</h4>
                  <Badge variant="outline">{format(new Date(ag.data_agendamento), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{ag.descricao_servico}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{profissional?.nome || 'Profissional'}</span>
                  {ag.valor_estimado && <span className="font-medium text-green-600">R$ {ag.valor_estimado.toFixed(2)}</span>}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
};

const CalendarioMobileSemanal = ({ dataAtual, agendamentos, clientes, profissionais, onAgendamentoClick }) => {
  const inicioSemana = startOfWeek(dataAtual, { weekStartsOn: 1 });
  const fimSemana = endOfWeek(dataAtual, { weekStartsOn: 1 });
  const diasDaSemana = eachDayOfInterval({ start: inicioSemana, end: fimSemana });

  return (
    <div className="space-y-4">
      {diasDaSemana.map((dia) => {
        const agendamentosDoDia = agendamentos.filter(ag => isSameDay(new Date(ag.data_agendamento), dia));
        const isHoje = isToday(dia);
        return (
          <div key={dia.toISOString()}>
            <div className={`flex items-center gap-3 mb-3 pb-2 border-b ${isHoje ? 'border-primary' : 'border-border'}`}>
              <div className={`text-center ${isHoje ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className="text-lg font-bold">{format(dia, 'd')}</div>
                <div className="text-xs">{format(dia, 'EEE', { locale: ptBR })}</div>
              </div>
              <div className="flex-1">
                <h3 className={`font-medium ${isHoje ? 'text-primary' : ''}`}>{format(dia, "EEEE, dd 'de' MMMM", { locale: ptBR })}</h3>
                <p className="text-xs text-muted-foreground">{agendamentosDoDia.length} agendamento{agendamentosDoDia.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            {agendamentosDoDia.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum agendamento</p>
              </div>
            ) : (
              <div className="space-y-3">
                {agendamentosDoDia.map((agendamento) => {
                  const cliente = clientes.find(c => c.id === agendamento.cliente_id);
                  const profissional = profissionais.find(p => p.id === agendamento.profissional_id);
                  const statusConfig = {
                    agendado: { variant: 'secondary', label: 'Agendado' },
                    confirmado: { variant: 'default', label: 'Confirmado' },
                    em_andamento: { variant: 'outline', label: 'Em Andamento' },
                    concluido: { variant: 'default', label: 'Concluído' },
                    cancelado: { variant: 'destructive', label: 'Cancelado' },
                    reagendado: { variant: 'outline', label: 'Reagendado' },
                  };
                  const currentStatus = statusConfig[agendamento.status] || statusConfig.agendado;
                  return (
                    <Card key={agendamento.id} className="hover:shadow-md transition-all cursor-pointer" onClick={() => onAgendamentoClick(agendamento)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-sm">{cliente?.nome || 'Cliente não encontrado'}</h4>
                            <p className="text-xs text-muted-foreground">{agendamento.descricao_servico}</p>
                          </div>
                          <Badge variant={currentStatus.variant} className="text-xs">{currentStatus.label}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            <span>{format(new Date(agendamento.data_agendamento), 'HH:mm')}</span>
                          </div>
                          {agendamento.valor_estimado && <span className="font-medium text-green-600">R$ {agendamento.valor_estimado.toFixed(2)}</span>}
                        </div>
                        {profissional && <div className="mt-2 text-xs text-muted-foreground">Profissional: {profissional.nome}</div>}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default function Agendamentos() {
  const { user } = useCurrentUser();
  const [dataAtual, setDataAtual] = useState(new Date());
  const [agendamentos, setAgendamentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [modalNovoAgendamento, setModalNovoAgendamento] = useState(false);
  const [agendamentoParaEditar, setAgendamentoParaEditar] = useState(null);
  const [modalDetalhes, setModalDetalhes] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('week');
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    if (!user) return;
    carregarDados();
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, [user]);

  useEffect(() => {
    if (!isLoading) localStorage.setItem('agendamentos_data', JSON.stringify(agendamentos));
  }, [agendamentos, isLoading]);

  useEffect(() => {
    if (!isLoading) localStorage.setItem('clientes_data', JSON.stringify(clientes));
  }, [clientes, isLoading]);

  useEffect(() => {
    if (!isLoading) localStorage.setItem('profissionais_data', JSON.stringify(profissionais));
  }, [profissionais, isLoading]);

  const carregarDados = async () => {
    setIsLoading(true);
    try {
      const owner = user?.email;
      const [agendamentosData, clientesData, profissionaisData] = await Promise.all([
        owner ? Agendamento.filter({ created_by: owner }) : [],
        owner ? Cliente.filter({ created_by: owner }) : [],
        owner ? Profissional.filter({ created_by: owner }) : []
      ]);
      setAgendamentos(agendamentosData);
      setClientes(clientesData);
      setProfissionais(profissionaisData);
    } catch (error) {
      const localAgendamentos = JSON.parse(localStorage.getItem('agendamentos_data') || '[]');
      const localClientes = JSON.parse(localStorage.getItem('clientes_data') || '[]');
      const localProfissionais = JSON.parse(localStorage.getItem('profissionais_data') || '[]');
      setAgendamentos(localAgendamentos);
      setClientes(localClientes);
      setProfissionais(localProfissionais);
    }
    setIsLoading(false);
  };

  const handleAbrirNovoAgendamento = () => { setAgendamentoParaEditar(null); setModalNovoAgendamento(true); };
  const handleAbrirEdicao = (agendamento) => { setModalDetalhes(null); setAgendamentoParaEditar(agendamento); setModalNovoAgendamento(true); };

  const handleUpdate = async () => {
    await carregarDados();
    if (modalDetalhes) {
      const updated = await Agendamento.filter({ id: modalDetalhes.id });
      if (updated?.length > 0) setModalDetalhes(updated[0]);
    }
  };

  const navegarPeriodo = (direcao) => {
    if (viewMode === 'week') setDataAtual(prev => direcao > 0 ? addWeeks(prev, 1) : subWeeks(prev, 1));
  };

  const formatarTituloPeriodo = () => {
    if (viewMode === 'week') {
      const inicioSemana = startOfWeek(dataAtual, { weekStartsOn: 1 });
      const fimSemana = endOfWeek(dataAtual, { weekStartsOn: 1 });
      return `${format(inicioSemana, 'dd MMM', { locale: ptBR })} - ${format(fimSemana, 'dd MMM yyyy', { locale: ptBR })}`;
    }
    return 'Próximos Agendamentos';
  };

  const handleToggleTheme = () => {
    const newIsDarkMode = !isDarkMode;
    setIsDarkMode(newIsDarkMode);
    if (newIsDarkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  };

  const renderCalendar = () => {
    if (viewMode === 'week') {
      return window.innerWidth >= 768 ? (
        <CalendarioSemanal dataAtual={dataAtual} agendamentos={agendamentos} clientes={clientes} onAgendamentoClick={setModalDetalhes} />
      ) : (
        <CalendarioMobileSemanal dataAtual={dataAtual} agendamentos={agendamentos} clientes={clientes} profissionais={profissionais} onAgendamentoClick={setModalDetalhes} />
      );
    } else if (viewMode === 'list') {
      return <ListaAgendamentos agendamentos={agendamentos} clientes={clientes} profissionais={profissionais} onAgendamentoClick={setModalDetalhes} />;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Agenda</h1>
          <p className="text-muted-foreground text-sm md:text-base">Gerencie seus agendamentos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleToggleTheme} title="Mudar Tema">
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Button onClick={handleAbrirNovoAgendamento} className="bg-primary w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" /> Novo Agendamento
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Button variant="outline" size="icon" onClick={() => navegarPeriodo(-1)} disabled={viewMode === 'list'} className="flex-shrink-0"><ChevronLeft className="w-4 h-4" /></Button>
                <h2 className="text-sm sm:text-base font-semibold truncate">{formatarTituloPeriodo()}</h2>
                <Button variant="outline" size="icon" onClick={() => navegarPeriodo(1)} disabled={viewMode === 'list'} className="flex-shrink-0"><ChevronRight className="w-4 h-4" /></Button>
              </div>
              <div className="flex gap-1 rounded-md bg-secondary p-1 flex-shrink-0">
                <Button size="sm" variant={viewMode === 'week' ? 'default' : 'ghost'} onClick={() => setViewMode('week')} className="text-xs px-3"><Grid className="w-3 h-3 mr-1" /> Semana</Button>
                <Button size="sm" variant={viewMode === 'list' ? 'default' : 'ghost'} onClick={() => setViewMode('list')} className="text-xs px-3"><List className="w-3 h-3 mr-1" /> Lista</Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando agendamentos...</p>
            </div>
          ) : renderCalendar()}
        </CardContent>
      </Card>

      {modalNovoAgendamento && (
        <NovoAgendamentoWizard
          isOpen={modalNovoAgendamento}
          onClose={() => { setModalNovoAgendamento(false); setAgendamentoParaEditar(null); }}
          clientes={clientes}
          profissionais={profissionais}
          agendamentoParaEditar={agendamentoParaEditar}
          onSuccess={() => { carregarDados(); setModalNovoAgendamento(false); setAgendamentoParaEditar(null); }}
        />
      )}

      {modalDetalhes && (
        <DetalhesAgendamentoModal
          agendamento={modalDetalhes}
          clientes={clientes}
          profissionais={profissionais}
          onClose={() => setModalDetalhes(null)}
          onUpdate={handleUpdate}
          onEdit={handleAbrirEdicao}
        />
      )}
    </div>
  );
}
pages/Calendario.jsx — 348 linhas
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import NovoAgendamentoWizard from "../components/agendamentos/NovoAgendamentoWizard";
import DetalhesAgendamentoModal from "../components/agendamentos/DetalhesAgendamentoModal";

const STATUS_COLORS = {
  agendado: "bg-blue-500",
  confirmado: "bg-green-500",
  em_andamento: "bg-yellow-500",
  concluido: "bg-gray-400",
  cancelado: "bg-red-500",
  reagendado: "bg-orange-500",
};

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8);

export default function Calendario() {
  const [dataAtual, setDataAtual] = useState(new Date());
  const [agendamentos, setAgendamentos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [filtroProfissional, setFiltroProfissional] = useState("todos");
  const [isLoading, setIsLoading] = useState(true);
  const [modalNovo, setModalNovo] = useState(false);
  const [modalDetalhes, setModalDetalhes] = useState(null);
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const [dataPreSelecionada, setDataPreSelecionada] = useState(null);
  const [viewMode, setViewMode] = useState("month");
  const [draggedAgId, setDraggedAgId] = useState(null);
  const [dragOverDay, setDragOverDay] = useState(null);

  useEffect(() => { carregarDados(); }, []);

  const carregarDados = async () => {
    setIsLoading(true);
    const [ags, cls, profs] = await Promise.all([
      base44.entities.Agendamento.list(),
      base44.entities.Cliente.list(),
      base44.entities.Profissional.list(),
    ]);
    setAgendamentos(ags);
    setClientes(cls);
    setProfissionais(profs);
    setIsLoading(false);
  };

  const agendamentosFiltrados = filtroProfissional === "todos"
    ? agendamentos
    : agendamentos.filter(ag => ag.profissional_id === filtroProfissional);

  const diasDoCalendario = () => {
    const inicio = startOfWeek(startOfMonth(dataAtual), { weekStartsOn: 1 });
    const fim = endOfWeek(endOfMonth(dataAtual), { weekStartsOn: 1 });
    return eachDayOfInterval({ start: inicio, end: fim });
  };

  const agendamentosDoDia = (dia) =>
    agendamentosFiltrados.filter(ag => isSameDay(new Date(ag.data_agendamento), dia))
      .sort((a, b) => new Date(a.data_agendamento) - new Date(b.data_agendamento));

  const handleClickDia = (dia) => { setDiaSelecionado(dia); setViewMode("day"); };

  const handleNovoNoDia = (dia, hora) => {
    const dt = new Date(dia);
    dt.setHours(hora, 0, 0, 0);
    const pad = (n) => String(n).padStart(2, "0");
    const iso = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(hora)}:00`;
    setDataPreSelecionada(iso);
    setModalNovo(true);
  };

  const profissionalDo = (ag) => profissionais.find(p => p.id === ag.profissional_id);
  const clienteDo = (ag) => clientes.find(c => c.id === ag.cliente_id);

  const agendamentosDoDiaSelecionado = diaSelecionado
    ? agendamentosFiltrados
        .filter(ag => isSameDay(new Date(ag.data_agendamento), diaSelecionado))
        .sort((a, b) => new Date(a.data_agendamento) - new Date(b.data_agendamento))
    : [];

  const getAgendamentosNaHora = (hora) =>
    agendamentosDoDiaSelecionado.filter(ag => new Date(ag.data_agendamento).getHours() === hora);

  const handleDragStart = (e, agId) => { setDraggedAgId(agId); e.dataTransfer.effectAllowed = 'move'; };

  const handleDropOnDay = async (e, targetDay) => {
    e.preventDefault();
    setDragOverDay(null);
    if (!draggedAgId) return;
    const ag = agendamentos.find(a => a.id === draggedAgId);
    if (!ag) return;
    const original = new Date(ag.data_agendamento);
    const nova = new Date(targetDay);
    nova.setHours(original.getHours(), original.getMinutes(), 0, 0);
    await base44.entities.Agendamento.update(ag.id, { data_agendamento: nova.toISOString() });
    setDraggedAgId(null);
    carregarDados();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold">Calendário</h1>
          <p className="text-sm text-muted-foreground">Visão geral da agenda por profissional</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={filtroProfissional} onValueChange={setFiltroProfissional}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Todos os profissionais" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os profissionais</SelectItem>
              {profissionais.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.cor_calendario || "#8B5CF6" }} />
                    {p.nome}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => { setDataPreSelecionada(null); setModalNovo(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Novo Agendamento
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {Object.entries(STATUS_COLORS).map(([s, cls]) => (
          <div key={s} className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${cls}`} />
            {s.charAt(0).toUpperCase() + s.slice(1).replace("_", " ")}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {viewMode === "day" && (
          <Button variant="outline" size="sm" onClick={() => setViewMode("month")}>
            <ChevronLeft className="w-3 h-3 mr-1" /> Voltar ao mês
          </Button>
        )}
        {viewMode === "month" && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setDataAtual(d => subMonths(d, 1))}><ChevronLeft className="w-4 h-4" /></Button>
            <span className="font-semibold capitalize text-sm w-40 text-center">{format(dataAtual, "MMMM yyyy", { locale: ptBR })}</span>
            <Button variant="outline" size="icon" onClick={() => setDataAtual(d => addMonths(d, 1))}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        )}
        {viewMode === "day" && diaSelecionado && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => { const prev = new Date(diaSelecionado); prev.setDate(prev.getDate() - 1); setDiaSelecionado(prev); }}><ChevronLeft className="w-4 h-4" /></Button>
            <span className="font-semibold text-sm capitalize w-56 text-center">{format(diaSelecionado, "EEEE, dd 'de' MMMM", { locale: ptBR })}</span>
            <Button variant="outline" size="icon" onClick={() => { const next = new Date(diaSelecionado); next.setDate(next.getDate() + 1); setDiaSelecionado(next); }}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
          Carregando...
        </div>
      ) : viewMode === "month" ? (
        <Card>
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b border-border">
              {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {diasDoCalendario().map((dia, idx) => {
                const ags = agendamentosDoDia(dia);
                const foraDoMes = !isSameMonth(dia, dataAtual);
                const hoje = isToday(dia);
                return (
                  <div
                    key={dia.toISOString()}
                    onClick={() => handleClickDia(dia)}
                    onDragOver={(e) => { e.preventDefault(); setDragOverDay(dia.toISOString()); }}
                    onDragLeave={() => setDragOverDay(null)}
                    onDrop={(e) => handleDropOnDay(e, dia)}
                    className={`min-h-[90px] p-1.5 border-b border-r border-border cursor-pointer hover:bg-accent/40 transition-colors
                      ${foraDoMes ? "opacity-40 bg-muted/20" : ""}
                      ${idx % 7 === 6 ? "border-r-0" : ""}
                      ${dragOverDay === dia.toISOString() ? "bg-primary/10 border-primary border-2" : ""}
                    `}
                  >
                    <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${hoje ? "bg-primary text-primary-foreground" : "text-foreground"}`}>
                      {format(dia, "d")}
                    </div>
                    <div className="space-y-0.5">
                      {ags.slice(0, 3).map(ag => {
                        const prof = profissionalDo(ag);
                        const cli = clienteDo(ag);
                        return (
                          <div
                            key={ag.id}
                            draggable
                            onDragStart={(e) => { e.stopPropagation(); handleDragStart(e, ag.id); }}
                            onClick={e => { e.stopPropagation(); setModalDetalhes(ag); }}
                            className={`text-[10px] px-1 py-0.5 rounded truncate text-white cursor-grab active:cursor-grabbing hover:opacity-80 ${STATUS_COLORS[ag.status] || "bg-primary"}`}
                            style={prof?.cor_calendario && filtroProfissional === "todos" ? { background: prof.cor_calendario } : {}}
                            title={`${format(new Date(ag.data_agendamento), "HH:mm")} - ${cli?.nome || "Cliente"} — Arraste para reagendar`}
                          >
                            {format(new Date(ag.data_agendamento), "HH:mm")} {cli?.nome?.split(" ")[0] || ""}
                          </div>
                        );
                      })}
                      {ags.length > 3 && <div className="text-[10px] text-muted-foreground pl-1">+{ags.length - 3} mais</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <div className="min-w-[320px]">
              {HOURS.map(hora => {
                const ags = getAgendamentosNaHora(hora);
                return (
                  <div key={hora} className="flex border-b border-border group">
                    <div className="w-14 shrink-0 text-xs text-muted-foreground text-right pr-2 py-3 border-r border-border">
                      {String(hora).padStart(2, "0")}:00
                    </div>
                    <div className="flex-1 min-h-[56px] p-1 relative">
                      {ags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {ags.map(ag => {
                            const cli = clienteDo(ag);
                            const prof = profissionalDo(ag);
                            return (
                              <div
                                key={ag.id}
                                onClick={() => setModalDetalhes(ag)}
                                className={`flex-1 min-w-[140px] max-w-xs rounded-md px-2 py-1.5 text-white cursor-pointer hover:opacity-80 transition-opacity ${STATUS_COLORS[ag.status] || "bg-primary"}`}
                                style={prof?.cor_calendario ? { background: prof.cor_calendario } : {}}
                              >
                                <div className="text-xs font-semibold truncate">{cli?.nome || "Cliente"}</div>
                                <div className="text-[10px] opacity-90 truncate">{ag.descricao_servico}</div>
                                {prof && <div className="text-[10px] opacity-75 truncate">{prof.nome}</div>}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleNovoNoDia(diaSelecionado, hora)}
                          className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <span className="text-xs text-primary flex items-center gap-1 bg-primary/10 px-2 py-1 rounded">
                            <Plus className="w-3 h-3" /> Agendar {String(hora).padStart(2, "0")}:00
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {modalNovo && (
        <NovoAgendamentoWizard
          isOpen={modalNovo}
          onClose={() => { setModalNovo(false); setDataPreSelecionada(null); }}
          clientes={clientes}
          profissionais={profissionais}
          agendamentoParaEditar={dataPreSelecionada ? { data_agendamento: dataPreSelecionada } : null}
          onSuccess={() => { carregarDados(); setModalNovo(false); setDataPreSelecionada(null); }}
        />
      )}

      {modalDetalhes && (
        <DetalhesAgendamentoModal
          agendamento={modalDetalhes}
          clientes={clientes}
          profissionais={profissionais}
          onClose={() => setModalDetalhes(null)}
          onUpdate={carregarDados}
          onEdit={(ag) => { setModalDetalhes(null); setDataPreSelecionada(null); setModalNovo(true); }}
        />
      )}
    </div>
  );
}

-------------------------------------

//Segunda Parte

1. components/agendamentos/NovoAgendamentoWizard.jsx
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, ChevronDown, ChevronUp, ImagePlus, X } from "lucide-react";

export default function NovoAgendamentoWizard({ isOpen, onClose, clientes, profissionais, agendamentoParaEditar, onSuccess }) {
  const [form, setForm] = useState({
    cliente_id: "", profissional_id: "", data_agendamento: "",
    duracao_estimada: 120, descricao_servico: "", valor_estimado: "",
    valor_sinal: "", status: "agendado", observacoes: "",
    regiao_corpo: "", estilo: "", primeira_tatuagem: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showNovoCliente, setShowNovoCliente] = useState(false);
  const [novoCliente, setNovoCliente] = useState({ nome: "", telefone: "", email: "", instagram: "" });
  const [clientesLocais, setClientesLocais] = useState([]);
  const [criandoCliente, setCriandoCliente] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setClientesLocais(clientes);
      setShowNovoCliente(false);
      setNovoCliente({ nome: "", telefone: "", email: "", instagram: "" });
    }
  }, [isOpen]);

  useEffect(() => {
    if (agendamentoParaEditar) {
      const data = new Date(agendamentoParaEditar.data_agendamento);
      const localISO = new Date(data.getTime() - data.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setForm({
        cliente_id: agendamentoParaEditar.cliente_id || "",
        profissional_id: agendamentoParaEditar.profissional_id || "",
        data_agendamento: localISO,
        duracao_estimada: agendamentoParaEditar.duracao_estimada || 120,
        descricao_servico: agendamentoParaEditar.descricao_servico || "",
        valor_estimado: agendamentoParaEditar.valor_estimado || "",
        valor_sinal: agendamentoParaEditar.valor_sinal || "",
        status: agendamentoParaEditar.status || "agendado",
        observacoes: agendamentoParaEditar.observacoes || "",
        regiao_corpo: agendamentoParaEditar.regiao_corpo || "",
        estilo: agendamentoParaEditar.estilo || "",
        primeira_tatuagem: agendamentoParaEditar.primeira_tatuagem || false,
        fotos_referencia: agendamentoParaEditar.fotos_referencia || [],
      });
    } else {
      setForm({
        cliente_id: "", profissional_id: "", data_agendamento: "",
        duracao_estimada: 120, descricao_servico: "", valor_estimado: "",
        valor_sinal: "", status: "agendado", observacoes: "",
        regiao_corpo: "", estilo: "", primeira_tatuagem: false, fotos_referencia: [],
      });
    }
  }, [agendamentoParaEditar, isOpen]);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const dataParte = form.data_agendamento ? form.data_agendamento.slice(0, 10) : "";
  const horaParte = form.data_agendamento ? form.data_agendamento.slice(11, 16) : "";

  const handleDataChange = (novaData) => {
    if (!novaData) return;
    const hora = horaParte || "09:00";
    handleChange("data_agendamento", `${novaData}T${hora}`);
  };

  const handleHoraChange = (novaHora) => {
    if (!novaHora) return;
    const data = dataParte || new Date().toISOString().slice(0, 10);
    handleChange("data_agendamento", `${data}T${novaHora}`);
  };

  const handleUploadFoto = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadingImg(true);
    const urls = await Promise.all(files.map(f => base44.integrations.Core.UploadFile({ file: f }).then(r => r.file_url)));
    setForm(prev => ({ ...prev, fotos_referencia: [...(prev.fotos_referencia || []), ...urls] }));
    setUploadingImg(false);
    e.target.value = "";
  };

  const handleRemoverFoto = (idx) => {
    setForm(prev => ({ ...prev, fotos_referencia: prev.fotos_referencia.filter((_, i) => i !== idx) }));
  };

  const handleCriarCliente = async () => {
    if (!novoCliente.nome.trim()) return;
    setCriandoCliente(true);
    const criado = await base44.entities.Cliente.create({ ...novoCliente, tipo: "cliente", status_cliente: "novo" });
    setClientesLocais(prev => [...prev, criado]);
    setForm(prev => ({ ...prev, cliente_id: criado.id }));
    setNovoCliente({ nome: "", telefone: "", email: "", instagram: "" });
    setShowNovoCliente(false);
    setCriandoCliente(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.cliente_id || !form.data_agendamento) return;
    setIsLoading(true);
    const payload = {
      ...form,
      valor_estimado: form.valor_estimado !== "" ? parseFloat(form.valor_estimado) : null,
      valor_sinal: form.valor_sinal !== "" ? parseFloat(form.valor_sinal) : null,
    };
    if (agendamentoParaEditar) {
      await base44.entities.Agendamento.update(agendamentoParaEditar.id, payload);
    } else {
      await base44.entities.Agendamento.create(payload);
    }
    setIsLoading(false);
    onSuccess();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{agendamentoParaEditar ? "Editar Agendamento" : "Novo Agendamento"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cliente */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Cliente *</Label>
              <Button type="button" variant="ghost" size="sm" className="text-xs text-primary h-auto py-0 px-1" onClick={() => setShowNovoCliente(v => !v)}>
                <UserPlus className="w-3 h-3 mr-1" />
                {showNovoCliente ? "Cancelar" : "Novo cliente"}
                {showNovoCliente ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
              </Button>
            </div>
            {showNovoCliente ? (
              <div className="border border-border rounded-lg p-3 space-y-3 bg-muted/30">
                <p className="text-xs text-muted-foreground font-medium">Cadastrar novo cliente</p>
                <Input placeholder="Nome completo *" value={novoCliente.nome} onChange={e => setNovoCliente(p => ({ ...p, nome: e.target.value }))} />
                <Input placeholder="WhatsApp (ex: 11999998888)" value={novoCliente.telefone} onChange={e => setNovoCliente(p => ({ ...p, telefone: e.target.value }))} />
                <Input placeholder="Email" value={novoCliente.email} onChange={e => setNovoCliente(p => ({ ...p, email: e.target.value }))} />
                <Input placeholder="Instagram (sem @)" value={novoCliente.instagram} onChange={e => setNovoCliente(p => ({ ...p, instagram: e.target.value }))} />
                <Button type="button" size="sm" className="w-full" onClick={handleCriarCliente} disabled={criandoCliente || !novoCliente.nome.trim()}>
                  {criandoCliente ? "Criando..." : "Criar e selecionar cliente"}
                </Button>
              </div>
            ) : (
              <Select value={form.cliente_id} onValueChange={v => handleChange("cliente_id", v)} required>
                <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>
                  {clientesLocais.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Profissional */}
          <div className="space-y-2">
            <Label>Profissional</Label>
            <Select value={form.profissional_id} onValueChange={v => handleChange("profissional_id", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione o profissional" /></SelectTrigger>
              <SelectContent>
                {profissionais.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data *</Label>
              <Input type="date" value={dataParte} onChange={e => handleDataChange(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Horário *</Label>
              <Input type="time" value={horaParte} onChange={e => handleHoraChange(e.target.value)} required />
            </div>
          </div>

          {/* Serviço */}
          <div className="space-y-2">
            <Label>Descrição do Serviço *</Label>
            <Textarea value={form.descricao_servico} onChange={e => handleChange("descricao_servico", e.target.value)} placeholder="Descreva a tatuagem/serviço..." required />
          </div>

          {/* Valores */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor Estimado (R$)</Label>
              <Input type="number" value={form.valor_estimado} onChange={e => handleChange("valor_estimado", e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Valor do Sinal (R$)</Label>
              <Input type="number" value={form.valor_sinal} onChange={e => handleChange("valor_sinal", e.target.value)} placeholder="0.00" />
            </div>
          </div>

          {/* Região e Estilo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Região do Corpo</Label>
              <Select value={form.regiao_corpo} onValueChange={v => handleChange("regiao_corpo", v)}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  {["braco","perna","peito","costas","pescoco","mao","pe","outro"].map(r => <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estilo</Label>
              <Select value={form.estilo} onValueChange={v => handleChange("estilo", v)}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  {["tradicional","realismo","aquarela","geometrico","minimalista","tribal","blackwork","outro"].map(e => <SelectItem key={e} value={e}>{e.charAt(0).toUpperCase()+e.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => handleChange("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[["agendado","Agendado"],["confirmado","Confirmado"],["em_andamento","Em Andamento"],["concluido","Concluído"],["cancelado","Cancelado"],["reagendado","Reagendado"]].map(([val, label]) => <SelectItem key={val} value={val}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={form.observacoes} onChange={e => handleChange("observacoes", e.target.value)} placeholder="Notas adicionais..." />
          </div>

          {/* Fotos */}
          <div className="space-y-2">
            <Label>Fotos de Referência</Label>
            <div className="flex flex-wrap gap-2">
              {(form.fotos_referencia || []).map((url, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => handleRemoverFoto(idx)} className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                {uploadingImg ? <span className="text-xs text-muted-foreground">...</span> : <>
                  <ImagePlus className="w-5 h-5 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Adicionar</span>
                </>}
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleUploadFoto} disabled={uploadingImg} />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : agendamentoParaEditar ? "Salvar Alterações" : "Criar Agendamento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
2. components/agendamentos/DetalhesAgendamentoModal.jsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Agendamento } from "@/entities/Agendamento";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, DollarSign, Palette, Trash2, Settings, Send, X, FileText, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, Loader2, List } from "lucide-react";

export default function DetalhesAgendamentoModal({ agendamento, clientes, profissionais, onClose, onUpdate, onEdit }) {
  const [cliente, setCliente] = useState(null);
  const [profissional, setProfissional] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showMsgSelector, setShowMsgSelector] = useState(false);

  const MESSAGE_TYPES = [
    { key: 'confirmacao', label: '✅ Confirmação de Agendamento', storageKey: 'confirmacaoMessage', default: "Olá {cliente}! ✅\nSeu agendamento foi *confirmado*:\n\n📅 {data} às {horario}\n🎨 {servico}\n👨‍🎨 {profissional}\n\nQualquer dúvida, é só falar!" },
    { key: 'reminder', label: '🔔 Lembrete de Agendamento', storageKey: 'reminderMessage', default: "Olá {cliente}! 😊\nLembrando do seu agendamento:\n\n📅 {data} às {horario}\n🎨 {servico}\n\nEstamos te esperando!" },
    { key: 'followup', label: '💬 Follow-up Pós-Sessão', storageKey: 'followUpMessage', default: "Obrigado por confiar na gente, {cliente}! Como está a cicatrização? 🌿" },
  ];

  const hasImages = agendamento?.fotos_referencia && agendamento.fotos_referencia.length > 0;

  useEffect(() => {
    if (agendamento) {
      setCliente(clientes.find(c => c.id === agendamento.cliente_id));
      setProfissional(profissionais.find(p => p.id === agendamento.profissional_id));
      setCurrentImageIndex(0);
    }
  }, [agendamento, clientes, profissionais]);

  const handleStatusChange = async (newStatus) => {
    await Agendamento.update(agendamento.id, { status: newStatus });
    onUpdate();
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) return;
    setIsDeleting(true);
    await Agendamento.delete(agendamento.id);
    onUpdate();
    onClose();
    setIsDeleting(false);
  };

  // ⬇️ AQUI ESTÁ TODA A LÓGICA DO WHATSAPP
  const handleSendWhatsApp = (msgTypeKey) => {
    if (!cliente?.telefone) {
      alert("Número de telefone do cliente não encontrado.");
      return;
    }
    const msgType = MESSAGE_TYPES.find(m => m.key === msgTypeKey);
    // Pega o template salvo nas Configurações, ou usa o padrão
    const template = localStorage.getItem(msgType.storageKey) || msgType.default;
    const clienteNome = cliente?.nome?.split(' ')[0] || 'Cliente';
    const dataFormatada = format(new Date(agendamento.data_agendamento), "dd/MM/yyyy", { locale: ptBR });
    const horario = format(new Date(agendamento.data_agendamento), "HH:mm", { locale: ptBR });
    // Substitui as variáveis
    const mensagem = template
      .replace(/{cliente}/g, clienteNome)
      .replace(/{nome}/g, clienteNome)
      .replace(/{data}/g, dataFormatada)
      .replace(/{horario}/g, horario)
      .replace(/{servico}/g, agendamento.descricao_servico || '')
      .replace(/{profissional}/g, profissional?.nome || '');
    // Limpa o número e abre o WhatsApp Web
    const telefoneLimpo = cliente.telefone.replace(/\D/g, '');
    window.open(`https://wa.me/55${telefoneLimpo}?text=${encodeURIComponent(mensagem)}`, '_blank');
    setShowMsgSelector(false);
  };

  const nextImage = () => setCurrentImageIndex(prev => (prev + 1) % agendamento.fotos_referencia.length);
  const prevImage = () => setCurrentImageIndex(prev => (prev - 1 + agendamento.fotos_referencia.length) % agendamento.fotos_referencia.length);

  if (!agendamento) return null;

  const statusOptions = [
    { value: 'agendado', label: 'Agendado', icon: Calendar },
    { value: 'confirmado', label: 'Confirmado', icon: CheckCircle2 },
    { value: 'em_andamento', label: 'Em Andamento', icon: Loader2 },
    { value: 'concluido', label: 'Concluído', icon: CheckCircle2, color: 'text-green-500' },
    { value: 'cancelado', label: 'Cancelado', icon: AlertTriangle },
    { value: 'reagendado', label: 'Reagendado', icon: List }
  ];

  // Seletor de tipo de mensagem
  if (showMsgSelector) return (
    <Dialog open={true} onOpenChange={() => setShowMsgSelector(false)}>
      <DialogContent className="max-w-sm w-[95vw]">
        <DialogHeader>
          <DialogTitle>Qual mensagem enviar?</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2">
          {MESSAGE_TYPES.map(m => (
            <Button key={m.key} variant="outline" className="w-full justify-start text-left h-auto py-3" onClick={() => handleSendWhatsApp(m.key)}>
              {m.label}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <Dialog open={!!agendamento} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[95vw] max-h-[90vh] bg-card border-border flex flex-col p-0">
        {/* Imagem de referência */}
        <div className="relative">
          {hasImages ? (
            <>
              <img src={agendamento.fotos_referencia[currentImageIndex]} alt="" className="w-full h-64 object-cover rounded-t-lg" />
              {agendamento.fotos_referencia.length > 1 && (
                <>
                  <Button variant="ghost" size="icon" className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white" onClick={prevImage}><ChevronLeft className="w-5 h-5"/></Button>
                  <Button variant="ghost" size="icon" className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white" onClick={nextImage}><ChevronRight className="w-5 h-5"/></Button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">{currentImageIndex + 1} / {agendamento.fotos_referencia.length}</div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-64 bg-secondary rounded-t-lg flex items-center justify-center">
              <FileText className="w-16 h-16 text-muted-foreground" />
            </div>
          )}
          <Button variant="ghost" size="icon" className="absolute top-2 right-2 bg-black/30 hover:bg-black/50 text-white" onClick={onClose}><X className="w-4 h-4"/></Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold">{cliente?.nome || 'Cliente não encontrado'}</h3>
              <p className="text-muted-foreground">{agendamento.descricao_servico}</p>
            </div>
            <div className="flex items-center gap-1">
              {/* Botão WhatsApp — abre seletor de tipo de mensagem */}
              <Button variant="ghost" size="icon" onClick={() => setShowMsgSelector(true)} title="Enviar via WhatsApp">
                <Send className="w-5 h-5 text-green-500" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onEdit?.(agendamento)} title="Editar">
                <Settings className="w-5 h-5 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isDeleting} title="Excluir">
                {isDeleting ? <div className="w-5 h-5 border-2 border-destructive border-t-transparent rounded-full animate-spin"/> : <Trash2 className="w-5 h-5 text-destructive" />}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 bg-secondary/30 p-2 rounded-lg">
              <Calendar className="w-4 h-4 text-primary"/>
              <span>{format(new Date(agendamento.data_agendamento), "dd/MM/yyyy", { locale: ptBR })}</span>
            </div>
            <div className="flex items-center gap-2 bg-secondary/30 p-2 rounded-lg">
              <Clock className="w-4 h-4 text-primary"/>
              <span>{format(new Date(agendamento.data_agendamento), "HH:mm", { locale: ptBR })}</span>
            </div>
            <div className="flex items-center gap-2 bg-secondary/30 p-2 rounded-lg">
              <DollarSign className="w-4 h-4 text-green-500"/>
              <span className="font-semibold">R$ {(agendamento.valor_estimado || 0).toFixed(2)}</span>
            </div>
            {profissional && (
              <div className="flex items-center gap-2 bg-secondary/30 p-2 rounded-lg">
                <Palette className="w-4 h-4 text-primary"/>
                <span>{profissional.nome}</span>
              </div>
            )}
          </div>

          <Select value={agendamento.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Mudar status..." /></SelectTrigger>
            <SelectContent>
              {statusOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <div className={`flex items-center gap-2 ${option.color || ''}`}>
                    <option.icon className="w-4 h-4" />
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {agendamento.observacoes && (
            <div className="bg-secondary/30 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Observações:</p>
              <p className="text-sm">{agendamento.observacoes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


3. pages/Configuracoes.jsx — Mensagens automáticas (trecho principal)
O arquivo completo tem 635 linhas. A parte das mensagens automáticas (aba "Mensagens") funciona assim:

Como funciona o WhatsApp no sistema:
Cliente cadastrado com telefone → Agendamento criado
    ↓
DetalhesAgendamentoModal → botão Send (verde)
    ↓
showMsgSelector abre → usuário escolhe tipo:
  • ✅ Confirmação   → usa localStorage['confirmacaoMessage']
  • 🔔 Lembrete      → usa localStorage['reminderMessage']  
  • 💬 Follow-up     → usa localStorage['followUpMessage']
    ↓
Substitui variáveis: {cliente} {data} {horario} {servico} {profissional}
    ↓
window.open(`https://wa.me/55${telefone}?text=...`)
→ Abre WhatsApp Web com mensagem pronta
Para o WhatsApp funcionar, precisa de:
Requisito	Status
Cliente com telefone cadastrado	✅ já existe no form
Template salvo nas Configurações	✅ salvo no localStorage
Clicar no botão Send nos detalhes	✅ já existe
Abertura manual pelo usuário	✅ abre wa.me no browser
⚠️ Envio 100% automático (sem clique humano) exige backend functions — disponível no plano Builder+. O que está implementado é o fluxo manual via wa.me, que é totalmente funcional.