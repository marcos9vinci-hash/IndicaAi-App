import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, Calendar, Trophy, User, ShieldAlert } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();

  const navItems = [
    { label: 'Status', icon: Home, path: '/' },
    { label: 'Rede', icon: Users, path: '/network' },
    { label: 'Agendar', icon: Calendar, path: '/booking' },
    { label: 'Ranking', icon: Trophy, path: '/ranking' },
    { label: 'Perfil', icon: User, path: '/profile' },
  ];

  // Adiciona aba Admin se o usuário for administrador
  if (profile?.role === 'admin') {
    navItems.push({ label: 'Admin', icon: ShieldAlert, path: '/admin' });
  }

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 pt-3 pb-6 bg-zinc-950/90 backdrop-blur-2xl border-t border-white/10 rounded-t-2xl shadow-[0_-4px_20px_rgba(204,255,0,0.1)]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex flex-col items-center justify-center transition-all duration-300 min-w-[60px]",
              isActive 
                ? "text-primary-fixed drop-shadow-[0_0_8px_rgba(204,255,0,0.5)] scale-110" 
                : "text-zinc-500 hover:text-white"
            )}
          >
            <Icon className="w-6 h-6 mb-1" />
            <span className="font-headline text-[9px] uppercase font-bold tracking-tighter">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

