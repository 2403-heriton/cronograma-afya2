import React, { useMemo } from 'react';
import type { Event } from '../types';
import { MODULE_COLORS, DEFAULT_MODULE_COLOR } from '../constants';
import NotFoundIcon from './icons/NotFoundIcon';
import CalendarIcon from './icons/CalendarIcon';
import ClockIcon from './icons/ClockIcon';
import LocationIcon from './icons/LocationIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';

const EventInfo: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-2 text-sm text-gray-400">
    <span className="text-gray-400">{icon}</span>
    <span><strong className="font-medium text-gray-300">{label}:</strong> {value}</span>
  </div>
);

const EventCard: React.FC<{ event: Event }> = ({ event }) => {
  const colorClass = event.modulo ? MODULE_COLORS[event.modulo] || DEFAULT_MODULE_COLOR : DEFAULT_MODULE_COLOR;
  return (
    <div className={`bg-gray-700/50 p-4 rounded-lg border-l-4 ${colorClass} border-t border-r border-b border-gray-600 transition-shadow duration-300 hover:shadow-md hover:bg-gray-700`}>
      <p className="font-bold text-white mb-2">{event.disciplina}</p>
      <div className="space-y-1">
        <EventInfo icon={<ClipboardListIcon className="w-4 h-4" />} label="Tipo" value={event.tipo} />
        <EventInfo icon={<ClockIcon className="w-4 h-4" />} label="Horário" value={event.horario} />
        <EventInfo icon={<LocationIcon className="w-4 h-4" />} label="Local" value={event.local} />
      </div>
    </div>
  );
};

const AssessmentDisplay: React.FC<{ events: Event[] | null }> = ({ events }) => {
  const groupedEvents = useMemo(() => {
    if (!events) return {};
    return events.reduce((acc, event) => {
      const date = event.data;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(event);
      return acc;
    }, {} as Record<string, Event[]>);
  }, [events]);

  if (!events) {
    return (
      <div className="text-center text-gray-400 p-8 bg-gray-800 rounded-2xl shadow-lg border border-gray-700">
        <NotFoundIcon className="w-16 h-16 mx-auto text-gray-500 mb-4" />
        <p className="text-xl font-semibold text-white">Nenhum evento encontrado.</p>
        <p className="text-md mt-1 text-gray-400">
           Use o botão "Atualizar Dados via Planilha" para carregar os eventos.
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    if (!dateString || typeof dateString !== 'string') return "Data Inválida";
    const parts = dateString.split('/');
    if (parts.length !== 3) return dateString;
    const [day, month, year] = parts.map(Number);
    if (isNaN(day) || isNaN(month) || isNaN(year) || year < 1970) {
        return dateString;
    }
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) {
        return dateString;
    }
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Sao_Paulo',
    }).format(date);
  };

  return (
    <div className="space-y-8">
      {Object.entries(groupedEvents).map(([date, eventsOnDate], index) => (
        <div key={date} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
          <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden">
            <h3 className="bg-afya-pink/80 text-white text-lg font-semibold p-4 flex items-center gap-3">
              <CalendarIcon className="w-6 h-6" />
              {formatDate(date)}
            </h3>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventsOnDate.map((event, idx) => (
                <EventCard key={`${event.disciplina}-${idx}`} event={event} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AssessmentDisplay;