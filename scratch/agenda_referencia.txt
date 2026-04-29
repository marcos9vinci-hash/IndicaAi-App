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