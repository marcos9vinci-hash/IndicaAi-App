import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Users, Ban } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Booking, StudioSettings, BookingStatus } from '../../types';

interface UnifiedCalendarProps {
  bookings: Booking[];
  settings: StudioSettings;
  onDateSelect: (date: Date) => void;
}

export default function UnifiedCalendar({ bookings, settings, onDateSelect }: UnifiedCalendarProps) {
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const next = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
    if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
    if (view === 'day') setCurrentDate(addDays(currentDate, 1));
  };

  const prev = () => {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
    if (view === 'week') setCurrentDate(subWeeks(currentDate, 1));
    if (view === 'day') setCurrentDate(subDays(currentDate, 1));
  };

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-6 bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
      <div className="flex items-center gap-4">
        <h2 className="font-headline text-lg font-black text-white uppercase tracking-widest">
          {format(currentDate, view === 'day' ? "dd 'de' MMMM" : "MMMM yyyy", { locale: ptBR })}
        </h2>
        <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
          {(['month', 'week', 'day'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "px-3 py-1.5 rounded-md text-[10px] font-headline uppercase tracking-widest transition-all",
                view === v ? "bg-primary-fixed text-black font-black" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {v === 'month' ? 'Mês' : v === 'week' ? 'Semana' : 'Dia'}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={prev} className="p-2 hover:bg-white/5 rounded-lg border border-white/5 transition-colors">
          <ChevronLeft className="w-5 h-5 text-zinc-400" />
        </button>
        <button onClick={next} className="p-2 hover:bg-white/5 rounded-lg border border-white/5 transition-colors">
          <ChevronRight className="w-5 h-5 text-zinc-400" />
        </button>
      </div>
    </div>
  );

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
          <div key={d} className="bg-zinc-950 p-3 text-center border-b border-white/5">
            <span className="text-[10px] font-headline uppercase tracking-widest text-zinc-500 font-black">{d}</span>
          </div>
        ))}
        {calendarDays.map((day, idx) => {
          const isBlockedDay = !settings.workingDays.includes(day.getDay());
          const isSelected = isSameDay(day, currentDate);
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayBookings = bookings.filter(b => b.date === dayStr);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const hasSpecificBlocks = settings.blockedIntervals?.some(b => b.date === dayStr);

          return (
            <div
              key={idx}
              onClick={() => onDateSelect(day)}
              className={cn(
                "min-h-[100px] p-2 transition-all cursor-pointer relative group",
                isCurrentMonth ? "bg-zinc-900/40" : "bg-black/20 opacity-30",
                isSelected && "ring-1 ring-inset ring-primary-fixed z-10 bg-primary-fixed/5",
                (isBlockedDay || hasSpecificBlocks) && "bg-red-500/5"
              )}
            >
              <div className="flex justify-between items-start">
                <span className={cn(
                  "text-[10px] font-headline font-black",
                  isSameDay(day, new Date()) ? "text-primary-fixed" : "text-zinc-500"
                )}>
                  {format(day, 'd')}
                </span>
                {(isBlockedDay || hasSpecificBlocks) && <Ban className="w-3 h-3 text-red-500/50" />}
              </div>
              <div className="mt-2 space-y-1">
                {dayBookings.slice(0, 3).map(b => (
                  <div key={b.id} className="text-[8px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 truncate font-headline uppercase">
                    {b.time} - {b.userName || 'Tattoo'}
                  </div>
                ))}
                {dayBookings.length > 3 && (
                  <div className="text-[8px] text-zinc-500 pl-1 font-headline uppercase">
                    + {dayBookings.length - 3} agendamentos
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekDays = eachDayOfInterval({ start: startDate, end: addDays(startDate, 6) });
    const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 08:00 to 22:00

    return (
      <div className="bg-zinc-900/40 rounded-2xl border border-white/5 overflow-hidden">
        <div className="grid grid-cols-8 border-b border-white/5">
          <div className="p-4 border-r border-white/5"></div>
          {weekDays.map(day => (
            <div key={day.toString()} className={cn(
              "p-4 text-center border-r border-white/5",
              isSameDay(day, new Date()) && "bg-primary-fixed/5"
            )}>
              <p className="text-[8px] text-zinc-500 font-headline uppercase tracking-widest">{format(day, 'EEE', { locale: ptBR })}</p>
              <p className={cn(
                "text-sm font-headline font-black",
                isSameDay(day, new Date()) ? "text-primary-fixed" : "text-white"
              )}>{format(day, 'dd')}</p>
            </div>
          ))}
        </div>
        <div className="overflow-y-auto max-h-[600px] scrollbar-hide">
          {hours.map(hour => (
            <div key={hour} className="grid grid-cols-8 border-b border-white/[0.02]">
              <div className="p-3 text-[10px] text-zinc-600 font-headline border-r border-white/5 text-right pr-4">
                {hour}:00
              </div>
              {weekDays.map(day => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const hourStr = `${hour.toString().padStart(2, '0')}:00`;
                const isBlockedDay = !settings.workingDays.includes(day.getDay());
                const specificBlock = settings.blockedIntervals?.find(block => 
                  block.date === dayStr && hourStr >= block.start && hourStr < block.end
                );
                const isBlocked = isBlockedDay || !!specificBlock;
                const booking = bookings.find(b => b.date === dayStr && b.time === hourStr);

                return (
                  <div key={day.toString()} className={cn(
                    "p-1 border-r border-white/5 min-h-[60px] relative",
                    isBlocked && "bg-red-500/[0.03]"
                  )}>
                    {specificBlock && (
                      <div className="absolute inset-x-1 top-1 text-[7px] text-red-500/40 font-headline uppercase font-black text-center truncate">
                        {specificBlock.label || 'Bloqueado'}
                      </div>
                    )}
                    {booking && (
                      <div className="absolute inset-1 rounded-lg bg-primary-fixed/10 border border-primary-fixed/20 p-2 overflow-hidden shadow-lg z-10">
                        <p className="text-[8px] font-black text-primary-fixed uppercase truncate">{booking.userName}</p>
                        <p className="text-[7px] text-zinc-500 uppercase">{booking.size}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 15 }, (_, i) => i + 8);
    const dayStr = format(currentDate, 'yyyy-MM-dd');
    const dayBookings = bookings.filter(b => b.date === dayStr);
    const isDayOff = !settings.workingDays.includes(currentDate.getDay());

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-zinc-900/40 rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-zinc-950/50">
            <h3 className="text-xs font-headline font-black text-white uppercase tracking-widest">Grade de Horários</h3>
          </div>
          <div className="p-6 space-y-4">
            {hours.map(hour => {
              const hourStr = `${hour.toString().padStart(2, '0')}:00`;
              const booking = dayBookings.find(b => b.time === hourStr);
              const specificBlock = settings.blockedIntervals?.find(block => 
                block.date === dayStr && hourStr >= block.start && hourStr < block.end
              );
              const isBlockedHour = isDayOff || !!specificBlock;

              return (
                <div key={hour} className="flex items-center gap-4 group">
                  <span className="w-12 text-[10px] text-zinc-500 font-headline">{hourStr}</span>
                  <div className={cn(
                    "flex-1 h-16 rounded-xl border transition-all flex items-center px-6",
                    booking ? "bg-primary-fixed/10 border-primary-fixed/20" : 
                    isBlockedHour ? "bg-red-500/5 border-red-500/10 opacity-50" : "bg-black/20 border-white/5 hover:border-white/10"
                  )}>
                    {booking ? (
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <p className="text-xs font-black text-white uppercase tracking-widest">{booking.userName}</p>
                          <p className="text-[10px] text-zinc-500 uppercase">{booking.size}</p>
                        </div>
                        <span className="text-[8px] bg-primary-fixed text-black px-2 py-1 rounded font-black uppercase tracking-tighter">
                          Confirmado
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-zinc-700 font-headline uppercase tracking-widest group-hover:text-zinc-500 flex items-center gap-2">
                        {isDayOff ? (
                          <><Ban className="w-3 h-3" /> Folga do Estúdio</>
                        ) : specificBlock ? (
                          <><Ban className="w-3 h-3" /> {specificBlock.label || 'Bloqueado'}</>
                        ) : (
                          'Horário Livre'
                        )}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-primary-fixed/5">
            <h4 className="text-[10px] font-headline font-black text-primary-fixed uppercase tracking-widest mb-4">Resumo do Dia</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-400">Total de Agendamentos</span>
                <span className="text-lg font-black text-white">{dayBookings.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-400">Faturamento Previsto</span>
                <span className="text-lg font-black text-primary-fixed">R$ {dayBookings.reduce((acc, b) => acc + (b.priceEstimated || 0), 0)}</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/5">
            <h4 className="text-[10px] font-headline font-black text-zinc-500 uppercase tracking-widest mb-4">Próximos Clientes</h4>
            <div className="space-y-4">
              {dayBookings.sort((a, b) => a.time.localeCompare(b.time)).map(b => (
                <div key={b.id} className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-white/5">
                   <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-black text-primary-fixed uppercase">
                     {b.userName?.charAt(0)}
                   </div>
                   <div>
                     <p className="text-[10px] font-black text-white uppercase">{b.userName}</p>
                     <p className="text-[8px] text-zinc-500 uppercase">{b.time} - {b.size}</p>
                   </div>
                </div>
              ))}
              {dayBookings.length === 0 && (
                <p className="text-[10px] text-zinc-600 font-headline text-center py-4">Sem compromissos para hoje.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {renderHeader()}
      {view === 'month' && renderMonthView()}
      {view === 'week' && renderWeekView()}
      {view === 'day' && renderDayView()}
    </div>
  );
}
