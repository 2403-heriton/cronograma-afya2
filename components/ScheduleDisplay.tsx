import React, { useMemo } from 'react';
import type { Schedule, DiaDeAula, Aula } from '../types';
import { MODULE_COLORS, DEFAULT_MODULE_COLOR } from '../constants';
import ClockIcon from './icons/ClockIcon';
import UserIcon from './icons/UserIcon';
import LocationIcon from './icons/LocationIcon';
import NotFoundIcon from './icons/NotFoundIcon';
import CoffeeIcon from './icons/CoffeeIcon';
import BookIcon from './icons/BookIcon';
import CalendarIcon from './icons/CalendarIcon';

// Local types for rendering logic
type HorarioLivre = {
  tipo: 'livre';
  horario: string;
  turno: string;
};
type ScheduleItem = Aula | HorarioLivre;


const AulaInfo: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-2 text-sm text-gray-400">
    <span className="text-gray-400">{icon}</span>
    <span><strong className="font-medium text-gray-300">{label}:</strong> {value}</span>
  </div>
);

const AulaCard: React.FC<{ aula: Aula }> = ({ aula }) => {
  const colorClass = aula.modulo ? MODULE_COLORS[aula.modulo] || DEFAULT_MODULE_COLOR : DEFAULT_MODULE_COLOR;
  
  const formatDate = (dateString: string) => {
    if (!dateString || typeof dateString !== 'string') return "Data Inválida";
    const parts = dateString.split('/');
    if (parts.length !== 3) return dateString; // Retorna o original se não for parseável
    const [day, month, year] = parts.map(Number);
    if (isNaN(day) || isNaN(month) || isNaN(year) || year < 1970) {
        return dateString;
    }
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) {
        return dateString;
    }
    // Retorna a data no formato DD/MM/YYYY
    return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' }).format(date);
  };
  
  return (
    <div className={`bg-gray-700/50 p-4 rounded-lg border-l-4 ${colorClass} border-t border-r border-b border-gray-600 transition-shadow duration-300 hover:shadow-md hover:bg-gray-700 flex flex-col`}>
      <div>
        <p className="font-bold text-white mb-2">{aula.disciplina}</p>
        <div className="space-y-1">
          <AulaInfo icon={<ClockIcon className="w-4 h-4" />} label="Horário" value={aula.horario} />
          <AulaInfo icon={<UserIcon className="w-4 h-4" />} label="Professor" value={aula.professor} />
          <AulaInfo icon={<LocationIcon className="w-4 h-4" />} label="Sala" value={aula.sala} />
        </div>
      </div>

      {aula.events && aula.events.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-600/50 space-y-2">
          {aula.events.map((event, index) => (
            <div key={index} className="flex items-start gap-2 text-sm text-amber-300 bg-amber-900/20 p-2 rounded-md">
               <CalendarIcon className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
               <div className="flex-grow">
                 <p className="font-semibold">{event.tipo}</p>
                 <p className="text-xs text-amber-200">{formatDate(event.data)} às {event.horario}</p>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const FreeSlotCard: React.FC<{ slot: HorarioLivre; fullDay?: boolean }> = ({ slot, fullDay }) => (
    <div className={`bg-green-500/25 p-4 rounded-lg border border-green-500/50 flex items-center justify-center text-center ${fullDay ? 'w-full h-full' : ''}`}>
        <div className="flex flex-col items-center gap-2 text-green-100">
            <div className="flex items-center gap-4">
              <CoffeeIcon className="w-6 h-6" />
              <BookIcon className="w-6 h-6" />
            </div>
            <div >
                <p className="font-semibold text-white">Horário Livre</p>
                <p className="text-sm text-green-200">{slot.horario}</p>
            </div>
        </div>
    </div>
);


const DiaCard: React.FC<{ diaDeAula: DiaDeAula }> = ({ diaDeAula }) => {
  const scheduleItems = useMemo((): ScheduleItem[] => {
    const SHIFTS = [
      { nome: "Manhã", start: 7, end: 12 },
      { nome: "Tarde", start: 12, end: 18 },
      { nome: "Noite", start: 18, end: 23 },
    ];

    const parseTime = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours + minutes / 60;
    };

    const formatTime = (hour: number): string => {
        const h = Math.floor(hour);
        const m = Math.round((hour - h) * 60);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const processedItems: ScheduleItem[] = [];
    const aulas = diaDeAula.aulas;

    SHIFTS.forEach(shift => {
      const aulasNoTurno = aulas
        .map(aula => {
            const [startStr, endStr] = aula.horario.split(' - ');
            return {
                ...aula,
                start: parseTime(startStr),
                end: parseTime(endStr),
            };
        })
        .filter(aula => aula.start >= shift.start && aula.end <= shift.end)
        .sort((a, b) => a.start - b.start);

      if (aulasNoTurno.length === 0) {
        // Não adiciona nada se o turno inteiro estiver livre, o Dia Inteiro Livre cuidará disso.
      } else {
        let cursor = shift.start;
        aulasNoTurno.forEach(aula => {
          if (aula.start > cursor) {
            processedItems.push({
              tipo: 'livre',
              turno: shift.nome,
              horario: `${formatTime(cursor)} - ${formatTime(aula.start)}`,
            });
          }
          processedItems.push(aula);
          cursor = aula.end;
        });
        if (cursor < shift.end) {
          processedItems.push({
            tipo: 'livre',
            turno: shift.nome,
            horario: `${formatTime(cursor)} - ${formatTime(shift.end)}`,
          });
        }
      }
    });
    
    // Se não houver aulas no dia todo, adiciona o aviso.
    if(processedItems.length === 0 && diaDeAula.aulas.length > 0) {
      // Caso raro onde as aulas estão fora dos turnos definidos, apenas as mostre.
       processedItems.push(...diaDeAula.aulas);
    }
    
    // Sort final items to ensure chrono order
    return processedItems.sort((a, b) => {
        const aStart = parseTime(a.horario.split(' - ')[0]);
        const bStart = parseTime(b.horario.split(' - ')[0]);
        return aStart - bStart;
    });

  }, [diaDeAula.aulas]);

  if (diaDeAula.aulas.length === 0) {
     return (
        <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden flex flex-col h-full">
            <h3 className="bg-afya-pink text-white text-lg font-semibold p-4 text-center">
                {diaDeAula.dia}
            </h3>
            <div className="p-4 flex-grow flex">
                <FreeSlotCard slot={{ tipo: 'livre', turno: 'Dia Inteiro', horario: '07:00 - 23:00' }} fullDay={true} />
            </div>
        </div>
     );
  }

  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden flex flex-col h-full">
      <h3 className="bg-afya-pink text-white text-lg font-semibold p-4 text-center">
        {diaDeAula.dia}
      </h3>
      <div className="p-4 flex-grow space-y-3">
        {scheduleItems.map((item, index) => {
            if ('disciplina' in item) { // Type guard for Aula
              return <AulaCard key={`${item.disciplina}-${index}`} aula={item} />;
            }
            // It must be HorarioLivre
            return <FreeSlotCard key={`${item.turno}-${index}`} slot={item} />;
          })
        }
      </div>
    </div>
  );
};


const ScheduleDisplay: React.FC<{ schedule: Schedule | null }> = ({ schedule }) => {
  if (!schedule) {
    return (
      <div className="text-center text-gray-400 p-8 bg-gray-800 rounded-2xl shadow-lg border border-gray-700">
        <NotFoundIcon className="w-16 h-16 mx-auto text-gray-500 mb-4" />
        <p className="text-xl font-semibold text-white">Nenhum cronograma encontrado.</p>
        <p className="text-md mt-1 text-gray-400">
          Verifique se os dados estão atualizados ou se os filtros selecionados estão corretos.
        </p>
      </div>
    );
  }

  const weekDays = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'];
  const completeSchedule = weekDays.map(dayName => {
      const dayData = schedule.find(d => d.dia === dayName);
      return dayData || { dia: dayName, aulas: [] };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {completeSchedule.map((dia, index) => (
        <div key={dia.dia} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
           <DiaCard diaDeAula={dia} />
        </div>
      ))}
    </div>
  );
};

export default ScheduleDisplay;