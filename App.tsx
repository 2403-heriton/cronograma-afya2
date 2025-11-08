import React, { useState, useCallback, useEffect } from 'react';
import { fetchSchedule, getUniqueModulesForPeriod, fetchEvents, loadDataFromLocalStorage } from './services/scheduleService';
import type { Schedule, ModuleSelection, Event, AulaEntry } from './types';
import { PERIODOS, GRUPOS } from './constants';
import ScheduleForm from './components/ScheduleForm';
import ScheduleDisplay from './components/ScheduleDisplay';
import AssessmentDisplay from './components/AssessmentDisplay';
import AfyaLogo from './components/icons/AfyaLogo';
import SpinnerIcon from './components/icons/SpinnerIcon';
import CalendarIcon from './components/icons/CalendarIcon';
import ClockIcon from './components/icons/ClockIcon';
import DataUploader from './components/DataUploader';

const App: React.FC = () => {
  const [allAulas, setAllAulas] = useState<AulaEntry[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);

  const [periodo, setPeriodo] = useState<string>(PERIODOS[0]);
  const [availableModules, setAvailableModules] = useState<string[]>([]);
  const [selections, setSelections] = useState<ModuleSelection[]>([
    { id: Date.now(), modulo: '', grupo: GRUPOS[0] }
  ]);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [events, setEvents] = useState<Event[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState<boolean>(false);
  const [view, setView] = useState<'schedule' | 'events'>('schedule');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Verifica o parâmetro da URL para ativar o modo de administrador
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true') {
      setIsAdmin(true);
    }
  }, []);

  // Carrega os dados do localStorage na inicialização
  useEffect(() => {
    const { aulas, events } = loadDataFromLocalStorage();
    setAllAulas(aulas);
    setAllEvents(events);
  }, []);

  useEffect(() => {
    setError(null);
    const modules = getUniqueModulesForPeriod(periodo, allAulas);
    setAvailableModules(modules);

    const firstModule = modules[0] || '';
    setSelections(prevSelections =>
      prevSelections.map(sel => ({
        ...sel,
        modulo: modules.includes(sel.modulo) ? sel.modulo : firstModule
      }))
    );
  }, [periodo, allAulas]);

  const addSelection = () => {
    setSelections(prev => [
      ...prev,
      { id: Date.now(), modulo: availableModules[0] || '', grupo: GRUPOS[0] }
    ]);
  };

  const removeSelection = (id: number) => {
    setSelections(prev => prev.filter(sel => sel.id !== id));
  };

  const updateSelection = (id: number, field: 'modulo' | 'grupo', value: string) => {
    setSelections(prev => 
      prev.map(sel => (sel.id === id ? { ...sel, [field]: value } : sel))
    );
  };

  const handlePeriodoChange = (newPeriodo: string) => {
    setPeriodo(newPeriodo);
    setSchedule(null);
    setEvents(null);
    setSearched(false);
    setError(null);
    setView('schedule');
  };

  const handleSearch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSchedule(null);
    setEvents(null);
    setSearched(true);
    setView('schedule');

    try {
      const selectionsPayload = selections.map(({ id, ...rest }) => rest);
      const scheduleResult = fetchSchedule(periodo, selectionsPayload, allAulas);
      const eventsResult = fetchEvents(periodo, selectionsPayload, allEvents);

      if (scheduleResult && eventsResult) {
        scheduleResult.forEach(dia => {
          dia.aulas.forEach(aula => {
            const matchingEvents = eventsResult.filter(event => 
              event.disciplina === aula.disciplina && event.modulo === aula.modulo
            );
            if (matchingEvents.length > 0) {
              aula.events = matchingEvents;
            }
          });
        });
      }

      setSchedule(scheduleResult);
      setEvents(eventsResult);
    } catch (e: any) {
      setError(e.message || "Ocorreu um erro desconhecido.");
    } finally {
      setIsLoading(false);
    }
  }, [periodo, selections, allAulas, allEvents]);

  const handleUploadSuccess = (data: { aulasData: AulaEntry[], eventsData: Event[] }) => {
    setAllAulas(data.aulasData);
    setAllEvents(data.eventsData);
    setSchedule(null);
    setEvents(null);
    setSearched(false);
    setError(null);
    // Recarrega a página sem o parâmetro de admin para sair do modo de upload
    window.history.replaceState({}, document.title, window.location.pathname);
    setIsAdmin(false);
  };


  return (
    <div className="min-h-screen font-sans flex flex-col bg-gray-900">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent z-10"></div>
        <img 
          src="https://cdn.prod.website-files.com/65b125bdd0407a7ed7dd8874/65b125bdd0407a7ed7dd8b9f_Medica-A-Gradu.png" 
          alt="Estudante de Medicina Afya"
          className="w-full h-[450px] object-cover object-top"
        />
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center z-20 -mt-8">
          <AfyaLogo className="w-64 h-auto mb-2" />
          <p className="text-gray-300 tracking-wide text-lg">Faculdade de Ciências Médicas - Paraiba</p>
          <p className="text-lg md:text-xl text-gray-200 mt-4 text-shadow-md">Consulte seu cronograma de aulas e eventos.</p>
        </div>
      </div>

      <main className="w-full max-w-6xl mx-auto flex-grow px-4 sm:px-6 lg:px-8 pb-8 -mt-32 z-30 relative">
        <ScheduleForm
          periodo={periodo}
          setPeriodo={handlePeriodoChange}
          selections={selections}
          availableModules={availableModules}
          addSelection={addSelection}
          removeSelection={removeSelection}
          updateSelection={updateSelection}
          onSearch={handleSearch}
          isLoading={isLoading}
        />
        
        {/* --- ÁREA DE RESULTADOS --- */}
        <div className="mt-10 min-h-[300px] w-full">
          {isLoading && (
            <div className="flex flex-col items-center justify-center text-center text-white pt-10">
              <SpinnerIcon className="w-12 h-12 mb-4" />
              <p className="text-lg font-semibold">Buscando seu cronograma...</p>
              <p className="text-sm text-gray-400">Isso pode levar alguns segundos.</p>
            </div>
          )}
          {error && (
            <div className="bg-afya-pink/10 border border-afya-pink/50 text-red-300 p-4 rounded-xl shadow-lg" role="alert">
              <p className="font-bold">Erro!</p>
              <p>{error}</p>
            </div>
          )}
          {searched && !isLoading && !error && (
             <>
              <div className="mb-6 flex justify-center border-b border-gray-700">
                <button
                  onClick={() => setView('schedule')}
                  className={`flex items-center gap-2 px-6 py-3 font-semibold text-lg transition-colors duration-200 ${view === 'schedule' ? 'text-afya-blue border-b-2 border-afya-blue' : 'text-gray-400 hover:text-white'}`}
                >
                  <ClockIcon className="w-5 h-5" />
                  Horário de Aulas
                </button>
                <button
                  onClick={() => setView('events')}
                  className={`flex items-center gap-2 px-6 py-3 font-semibold text-lg transition-colors duration-200 ${view === 'events' ? 'text-afya-pink border-b-2 border-afya-pink' : 'text-gray-400 hover:text-white'}`}
                >
                  <CalendarIcon className="w-5 h-5" />
                  Calendário de Eventos
                </button>
              </div>

              {view === 'schedule' ? (
                <ScheduleDisplay schedule={schedule} />
              ) : (
                <AssessmentDisplay events={events} />
              )}
            </>
          )}
          {!searched && !isLoading && (
             <div className="text-center text-gray-500 p-8 bg-gray-800/50 rounded-2xl shadow-sm border border-gray-700">
                <p className="text-lg">Seu cronograma e eventos aparecerão aqui após a busca.</p>
                <p className="text-sm mt-2">Use o formulário acima para selecionar seu período, módulo e grupo.</p>
            </div>
          )}
        </div>
      </main>

      <footer className="w-full text-center py-6 text-gray-500 text-sm mt-auto">
        {isAdmin && <DataUploader onUploadSuccess={handleUploadSuccess} />}
        <p className="mt-2">&copy; {new Date().getFullYear()} Afya Paraíba. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default App;