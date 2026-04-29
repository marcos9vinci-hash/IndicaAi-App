import React from 'react';
import { Clock, ToggleLeft, ToggleRight, Ban, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AdminSettingsProps {
  settings: any;
  setSettings: (settings: any) => void;
  handleUpdateSettings: () => void;
  newBlock: { date: string; start: string; end: string; label: string };
  setNewBlock: (block: any) => void;
  handleAddBlock: () => void;
  handleRemoveBlock: (index: number) => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  settings,
  setSettings,
  handleUpdateSettings,
  newBlock,
  setNewBlock,
  handleAddBlock,
  handleRemoveBlock
}) => {
  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Horários e Dias */}
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-headline text-lg text-white uppercase flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-fixed" />
              Horários de Trabalho
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setSettings({...settings, allowIndicatorBooking: !settings.allowIndicatorBooking})}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-[9px] font-headline uppercase tracking-widest font-black",
                  settings.allowIndicatorBooking 
                    ? "bg-primary-fixed/10 border-primary-fixed/30 text-primary-fixed" 
                    : "bg-zinc-800 border-white/5 text-zinc-500"
                )}
              >
                {settings.allowIndicatorBooking ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                Indicador
              </button>
              <button 
                onClick={() => setSettings({...settings, allowArtistBooking: !settings.allowArtistBooking})}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-[9px] font-headline uppercase tracking-widest font-black",
                  settings.allowArtistBooking 
                    ? "bg-primary-fixed/10 border-primary-fixed/30 text-primary-fixed" 
                    : "bg-zinc-800 border-white/5 text-zinc-500"
                )}
              >
                {settings.allowArtistBooking ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                Artista
              </button>
            </div>
          </div>
          
          <div>
            <label className="text-[10px] uppercase font-headline text-zinc-500 block mb-3 tracking-widest">Dias da Semana</label>
            <div className="flex flex-wrap gap-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, idx) => (
                <button
                  key={day}
                  onClick={() => {
                    const newDays = settings.workingDays.includes(idx)
                      ? settings.workingDays.filter(d => d !== idx)
                      : [...settings.workingDays, idx];
                    setSettings({...settings, workingDays: newDays});
                  }}
                  className={cn(
                    "w-10 h-10 rounded-lg font-headline text-[10px] uppercase transition-all flex items-center justify-center border",
                    settings.workingDays.includes(idx) ? "bg-primary-fixed text-black border-primary-fixed" : "bg-black text-zinc-500 border-white/5"
                  )}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase font-headline text-zinc-500 block mb-2 tracking-widest">Abertura</label>
              <input 
                type="time" 
                value={settings.workingHours.start}
                onChange={(e) => setSettings({...settings, workingHours: {...settings.workingHours, start: e.target.value}})}
                className="w-full bg-black border border-white/5 rounded-xl h-12 px-4 text-white font-headline"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-headline text-zinc-500 block mb-2 tracking-widest">Fechamento</label>
              <input 
                type="time" 
                value={settings.workingHours.end}
                onChange={(e) => setSettings({...settings, workingHours: {...settings.workingHours, end: e.target.value}})}
                className="w-full bg-black border border-white/5 rounded-xl h-12 px-4 text-white font-headline"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            <h3 className="font-headline text-lg text-white mb-4 uppercase flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-fixed" />
              Duração das Sessões (min)
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {(['Pequena', 'Média', 'Grande'] as const).map(size => (
                <div key={size}>
                  <label className="text-[10px] uppercase font-headline text-zinc-500 block mb-2 tracking-widest">{size}</label>
                  <input 
                    type="number" 
                    value={settings.durations?.[size] || 60}
                    onChange={(e) => setSettings({
                      ...settings, 
                      durations: { ...settings.durations, [size]: parseInt(e.target.value) }
                    })}
                    className="w-full bg-black border border-white/5 rounded-xl h-12 px-4 text-white font-headline"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bloqueios */}
        <div className="space-y-6">
          <h3 className="font-headline text-lg text-white mb-4 uppercase flex items-center gap-2">
            <Ban className="w-5 h-5 text-red-500" />
            Bloquear Horários
          </h3>

          <div className="glass-panel p-4 rounded-xl border border-white/5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-[8px] uppercase text-zinc-500 font-headline mb-1 block">Data</label>
                <input 
                  type="date" 
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-xs text-white"
                  value={newBlock.date}
                  onChange={e => setNewBlock({...newBlock, date: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[8px] uppercase text-zinc-500 font-headline mb-1 block">De</label>
                <input 
                  type="time" 
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-xs text-white"
                  value={newBlock.start}
                  onChange={e => setNewBlock({...newBlock, start: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[8px] uppercase text-zinc-500 font-headline mb-1 block">Até</label>
                <input 
                  type="time" 
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-xs text-white"
                  value={newBlock.end}
                  onChange={e => setNewBlock({...newBlock, end: e.target.value})}
                />
              </div>
            </div>
            <input 
              placeholder="Motivo (Opcional)" 
              className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-xs text-white"
              value={newBlock.label}
              onChange={e => setNewBlock({...newBlock, label: e.target.value})}
            />
            <button 
              onClick={handleAddBlock}
              className="w-full bg-red-500/20 text-red-400 border border-red-500/20 py-2 rounded-lg font-headline text-[10px] uppercase tracking-widest hover:bg-red-500/30 transition-all"
            >
              Adicionar Bloqueio
            </button>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
            {settings.blockedIntervals?.map((block: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-lg group">
                <div>
                  <p className="text-[10px] font-headline text-white uppercase">{block.date.split('-').reverse().join('/')}</p>
                  <p className="text-[9px] font-headline text-zinc-500 uppercase tracking-widest">
                    {block.start} - {block.end} {block.label && `• ${block.label}`}
                  </p>
                </div>
                <button 
                  onClick={() => handleRemoveBlock(idx)}
                  className="text-zinc-600 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-white/5">
        <button 
          onClick={handleUpdateSettings}
          className="w-full bg-primary-fixed text-black h-16 rounded-2xl font-headline font-black uppercase tracking-widest shadow-xl shadow-primary-fixed/20 hover:scale-[0.99] transition-all"
        >
          Salvar Todas as Configurações
        </button>
      </div>
    </div>
  );
};
