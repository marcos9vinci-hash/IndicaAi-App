import React, { useMemo, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  ArrowUpRight, 
  CreditCard, 
  BarChart2, 
  AlertTriangle,
  CheckCircle,
  Target,
  MessageSquare,
  DollarSign,
  Clock,
  Trophy
} from 'lucide-react';
import ReactivationCampaign from "../components/admin/ReactivationCampaign";
import { UserProfile, Booking, CreditTransaction, BookingStatus, TransactionType, InviteCode } from '../types';
import { cn } from '../lib/utils';
import { format, subDays, isSameMonth, isAfter, subMonths } from 'date-fns';

interface AdminDashboardProps {
  users: UserProfile[];
  bookings: Booking[];
  transactions: CreditTransaction[];
  invites: InviteCode[];
}

export default function AdminDashboard({ users, bookings, transactions, invites }: AdminDashboardProps) {
  const [showCampaign, setShowCampaign] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(7);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const metrics = useMemo(() => {
    // 1. Agenda Metrics
    const monthlyBookings = bookings.filter(b => {
      const date = new Date(b.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const completed = monthlyBookings.filter(b => b.status === BookingStatus.COMPLETED).length;
    const noShows = monthlyBookings.filter(b => b.status === BookingStatus.NO_SHOW).length;
    const attendanceRate = monthlyBookings.length > 0 
      ? ((completed / (completed + noShows)) * 100).toFixed(1) 
      : '0';

    // 2. Financial Metrics
    const completedAll = bookings.filter(b => b.status === BookingStatus.COMPLETED);
    const totalTattooValue = completedAll.reduce((acc, b) => acc + (b.priceEstimated || 0), 0);
    const totalDeposits = bookings.reduce((acc, b) => acc + (b.depositPaid || 0), 0);
    
    const monthlyTxs = transactions.filter(t => {
      const date = t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const creditsGenerated = monthlyTxs
      .filter(t => t.amount > 0 && t.type === TransactionType.REFERRAL)
      .reduce((acc, t) => acc + t.amount, 0);

    const creditsUsed = Math.abs(monthlyTxs
      .filter(t => t.amount < 0 && t.type === TransactionType.BOOKING_DISCOUNT)
      .reduce((acc, t) => acc + t.amount, 0));

    const avgDiscount = completed > 0 
      ? (creditsUsed / completed).toFixed(2)
      : '0';

    // 3. Growth Metrics
    const newUsers = users.filter(u => {
      const date = u.createdAt?.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;

    const referralUsers = users.filter(u => u.referredBy).length;
    const referralTattoos = completedAll.filter(b => {
      const user = users.find(u => u.uid === b.userId);
      return user?.referredBy;
    }).length;

    // Top Indicators (Referrers)
    const referrerStats = users.reduce((acc, u) => {
      if (u.referredBy) {
        acc[u.referredBy] = (acc[u.referredBy] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const topReferrers = Object.entries(referrerStats)
      .map(([uid, count]) => ({
        name: users.find(u => u.uid === uid)?.name || 'Anônimo',
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 4. Economy Metrics
    const totalActiveCredits = users.reduce((acc, u) => acc + (u.creditsBalance || 0), 0);
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const expiringSoon = transactions.filter(t => {
      if (!t.expiresAt || t.amount <= 0) return false;
      const expiry = t.expiresAt.toDate ? t.expiresAt.toDate() : new Date(t.expiresAt);
      return isAfter(expiry, now) && !isAfter(expiry, thirtyDaysFromNow);
    }).reduce((acc, t) => acc + t.amount, 0);

    const expiredMonth = Math.abs(monthlyTxs
      .filter(t => t.type === TransactionType.EXPIRATION)
      .reduce((acc, t) => acc + t.amount, 0));

    // Chart Data
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      const date = subMonths(now, 5 - i);
      const monthBookings = bookings.filter(b => {
        const d = new Date(b.date);
        return isSameMonth(d, date);
      }).length;
      return {
        name: format(date, 'MMM'),
        agendamentos: monthBookings
      };
    });

    const statusData = [
      { name: 'Concluído', value: completed, color: '#ccff00' },
      { name: 'No-Show', value: noShows, color: '#ff4444' },
      { name: 'Pendente', value: monthlyBookings.filter(b => b.status === BookingStatus.PENDING_APPROVAL).length, color: '#555555' }
    ].filter(d => d.value > 0);

    // 5. Beta Growth (New)
    const totalInviteRegistrations = invites.reduce((acc, inv) => acc + (inv.usesCount || 0), 0);
    const conversionRate = users.length > 0 
      ? Math.round((totalInviteRegistrations / users.length) * 100) 
      : 0;

    const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(now, 6 - i);
      const dayName = format(date, 'eee');
      const count = users.filter(u => {
        try {
          const uDate = u.createdAt?.toDate ? u.createdAt.toDate() : new Date(u.createdAt || Date.now());
          if (isNaN(uDate.getTime())) return false;
          return format(uDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
        } catch (e) {
          return false;
        }
      }).length;
      return { day: dayName, count };
    });

    // 6. Retention/Reactivation Metrics (Complete CRM Logic)
    const usersToReactivate = users.filter(u => {
      if (!u.phone || u.role === 'admin') return false;
      
      try {
        const lastActivity = u.lastSeenAt?.toDate 
          ? u.lastSeenAt.toDate() 
          : u.createdAt?.toDate 
            ? u.createdAt.toDate() 
            : new Date(u.createdAt || Date.now());
            
        if (isNaN(lastActivity.getTime())) return false;
            
        const daysSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceActivity >= selectedCampaign;
      } catch (e) {
        return false;
      }
    });

    return {
      agenda: { total: monthlyBookings.length, completed, noShows, attendanceRate },
      finance: { totalTattooValue, totalDeposits, creditsGenerated, creditsUsed, avgDiscount },
      growth: { newUsers, referralUsers, referralTattoos, topReferrers, totalInviteRegistrations, conversionRate },
      economy: { totalActiveCredits, expiringSoon, expiredMonth },
      charts: { last6Months, statusData, last7DaysData },
      retention: { usersToReactivate }
    };
  }, [users, bookings, transactions, invites, selectedCampaign]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <MetricCard 
          title="Faturamento Total" 
          value={`R$ ${metrics.finance.totalTattooValue}`} 
          subtitle="Sessões concluídas"
          icon={<DollarSign className="w-4 h-4 text-primary-fixed" />}
          trend="+12%"
        />
        <MetricCard 
          title="Agendamentos" 
          value={metrics.agenda.total.toString()} 
          subtitle="Este mês"
          icon={<Calendar className="w-4 h-4 text-blue-400" />}
        />
        <MetricCard 
          title="Novos Usuários" 
          value={metrics.growth.newUsers.toString()} 
          subtitle="Este mês"
          icon={<Users className="w-4 h-4 text-purple-400" />}
          trend="+5%"
        />
        <MetricCard 
          title="Conversão Convite" 
          value={`${metrics.growth.conversionRate}%`} 
          subtitle={`${metrics.growth.totalInviteRegistrations} via convite`}
          icon={<Target className="w-4 h-4 text-orange-400" />}
        />
        <MetricCard 
          title="Créditos Ativos" 
          value={`R$ ${metrics.economy.totalActiveCredits}`} 
          subtitle="No ecossistema"
          icon={<CreditCard className="w-4 h-4 text-yellow-400" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agenda Section */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline text-sm uppercase tracking-widest text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-fixed" />
              Efetividade da Agenda
            </h3>
            <span className="text-primary-fixed font-headline text-xs">{metrics.agenda.attendanceRate}% Comparecimento</span>
          </div>
          
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.charts.last6Months}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="name" stroke="#555" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }}
                  itemStyle={{ color: '#ccff00', fontSize: '12px' }}
                />
                <Bar dataKey="agendamentos" fill="#ccff00" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Finance & Economy Section */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5">
          <h3 className="font-headline text-sm uppercase tracking-widest text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-fixed" />
            Movimentação Financeira
          </h3>
          
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] uppercase text-zinc-500 font-headline mb-1">Créditos Gerados</p>
                <p className="text-xl font-headline text-white">R$ {metrics.finance.creditsGenerated}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase text-zinc-500 font-headline mb-1">Créditos Usados</p>
                <p className="text-xl font-headline text-primary-fixed">R$ {metrics.finance.creditsUsed}</p>
              </div>
            </div>
            
            <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden flex">
              <div 
                className="bg-primary-fixed h-full" 
                style={{ width: `${(metrics.finance.creditsUsed / (metrics.finance.creditsGenerated || 1)) * 100}%` }}
              ></div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <p className="text-[9px] uppercase text-zinc-500 font-headline mb-1">Total Sinais</p>
                <p className="font-headline text-white">R$ {metrics.finance.totalDeposits}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <p className="text-[9px] uppercase text-zinc-500 font-headline mb-1">Média Desconto</p>
                <p className="font-headline text-white">R$ {metrics.finance.avgDiscount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Growth Stats */}
        <div className="md:col-span-1 glass-panel p-6 rounded-2xl border border-white/5 bg-primary-fixed/[0.02]">
          <h3 className="font-headline text-sm uppercase tracking-widest text-white mb-6 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary-fixed" />
            Crescimento Orgânico
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 font-headline uppercase tracking-wider">Usuários por indicação</span>
              <span className="text-white font-black">{metrics.growth.referralUsers}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 font-headline uppercase tracking-wider">Tattoos por indicação</span>
              <span className="text-white font-black">{metrics.growth.referralTattoos}</span>
            </div>
            <div className="pt-4 border-t border-white/5">
              <p className="text-[10px] uppercase text-zinc-600 font-headline mb-4">Top 5 Indicadores</p>
              <div className="space-y-3">
                {metrics.growth.topReferrers.map((r, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">{r.name}</span>
                    <span className="text-xs bg-primary-fixed/20 text-primary-fixed px-2 py-0.5 rounded-full font-black">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Status Breakdown (Pie Chart) */}
        <div className="md:col-span-1 glass-panel p-6 rounded-2xl border border-white/5">
          <h3 className="font-headline text-sm uppercase tracking-widest text-white mb-6 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-blue-400" />
            Status das Sessões
          </h3>
          <div className="flex flex-col items-center justify-center">
             <div className="h-40 w-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.charts.statusData}
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {metrics.charts.statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
             </div>
             <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
                {metrics.charts.statusData.map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-zinc-500 font-headline">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                    {d.name}
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Economy Health */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-red-400/[0.02] flex flex-col h-full">
          <h3 className="font-headline text-sm uppercase tracking-widest text-white mb-6 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Saúde dos Créditos
          </h3>
          
          <div className="space-y-6 flex-1">
            <div className="p-4 bg-zinc-900/50 rounded-xl border border-white/5">
              <p className="text-[10px] uppercase text-zinc-500 font-headline mb-1 tracking-widest">Expiram em 30 dias</p>
              <p className="text-lg font-headline text-red-400">R$ {metrics.economy.expiringSoon}</p>
            </div>
            
            <div className="p-4 bg-zinc-900/50 rounded-xl border border-white/5">
              <p className="text-[10px] uppercase text-zinc-500 font-headline mb-1 tracking-widest">Expirados este mês</p>
              <p className="text-lg font-headline text-zinc-400">R$ {metrics.economy.expiredMonth}</p>
            </div>
          </div>
        </div>

        {/* Top Referrers Ranking */}
        <div className="md:col-span-1 glass-panel p-6 rounded-2xl border border-white/5 bg-primary-fixed/[0.01]">
          <h3 className="font-headline text-sm uppercase tracking-widest text-white mb-6 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            Ranking de Elite
          </h3>
          
          <div className="space-y-3">
            {metrics.growth.topReferrers.length > 0 ? (
              metrics.growth.topReferrers.map((ref, i) => (
                <div key={ref.id} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl border border-white/5 hover:bg-white/[0.05] transition-all group">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-headline text-[10px] ${
                      i === 0 ? 'bg-yellow-400 text-black' : 
                      i === 1 ? 'bg-zinc-300 text-black' : 
                      i === 2 ? 'bg-orange-400 text-black' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-xs font-headline text-white group-hover:text-primary-fixed transition-colors truncate max-w-[100px]">{ref.name}</p>
                      <p className="text-[8px] text-zinc-500 uppercase tracking-widest font-headline">{ref.inviteCode}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-headline text-primary-fixed">{ref.count}</p>
                    <p className="text-[8px] text-zinc-600 uppercase font-headline">Indicações</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 opacity-20 italic text-xs uppercase tracking-widest">
                Sem indicações este mês
              </div>
            )}
          </div>
        </div>

        {/* User Reactivation (Complete CRM) */}
        <div className="md:col-span-1 glass-panel p-6 rounded-2xl border border-primary-fixed/20 bg-primary-fixed/[0.02]">
          <h3 className="font-headline text-sm uppercase tracking-widest text-primary-fixed mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            CRM de Reativação
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-black/40 p-4 rounded-xl border border-white/5 text-center">
                <p className="text-3xl font-headline text-white mb-1">
                  {metrics.retention.usersToReactivate.length}
                </p>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-headline">Alvos</p>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-[8px] text-zinc-500 uppercase font-headline pl-1">Tempo Inativo</p>
                <select 
                  value={selectedCampaign}
                  onChange={(e) => setSelectedCampaign(Number(e.target.value))}
                  className="bg-black/60 text-white text-xs p-2 rounded-xl border border-white/10 outline-none font-headline uppercase tracking-widest w-full"
                >
                  <option value={7}>7 Dias</option>
                  <option value={14}>14 Dias</option>
                  <option value={30}>30 Dias</option>
                  <option value={60}>60+ Dias</option>
                </select>
              </div>
            </div>

            <button 
              onClick={() => setShowCampaign(true)}
              disabled={metrics.retention.usersToReactivate.length === 0}
              className="w-full py-4 bg-primary-fixed text-black font-headline uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
            >
              <TrendingUp className="w-4 h-4" />
              Iniciar Campanha
            </button>

            <p className="text-[9px] font-sans text-zinc-500 leading-tight uppercase tracking-wider text-center px-4">
              Segmentação inteligente: {selectedCampaign} dias sem acesso 🚀
            </p>
          </div>
        </div>
      </div>

      {/* Growth Over Time (Daily) */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5">
        <h3 className="font-headline text-sm uppercase tracking-widest text-white mb-6 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary-fixed" />
          Novos Membros (Últimos 7 dias)
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics.charts.last7DaysData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis dataKey="day" stroke="#555" fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }}
                itemStyle={{ color: '#ccff00', fontSize: '12px' }}
              />
              <Bar dataKey="count" fill="#ccff00" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {showCampaign && (
        <ReactivationCampaign 
          users={metrics.retention.usersToReactivate}
          onClose={() => setShowCampaign(false)}
          days={selectedCampaign}
        />
      )}
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon, trend }: { title: string, value: string, subtitle: string, icon: React.ReactNode, trend?: string }) {
  return (
    <div className="glass-panel p-5 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all">
      <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity">
        {icon}
      </div>
      <p className="text-[9px] uppercase font-headline text-zinc-500 tracking-widest mb-1">{title}</p>
      <div className="flex items-baseline gap-2">
        <h4 className="text-lg font-headline text-white font-black tracking-wider">{value}</h4>
        {trend && (
          <span className="text-[8px] font-headline text-primary-fixed bg-primary-fixed/10 px-1 rounded">{trend}</span>
        )}
      </div>
      <p className="text-[9px] text-zinc-600 font-headline mt-1 uppercase tracking-tighter">{subtitle}</p>
    </div>
  );
}
