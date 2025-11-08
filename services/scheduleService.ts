import type { Schedule, DiaDeAula, ModuleSelection, Aula, Event, AulaEntry } from "../types";

// Permite o uso da biblioteca XLSX carregada via tag de script
declare var XLSX: any;

const AULAS_KEY = 'afya-schedule-aulas';
const EVENTS_KEY = 'afya-schedule-events';

// Helper to interpret dates in DD/MM/AAAA format safely
const parseBrDate = (dateString: string): Date => {
  // Return a very early date if the string is invalid, so it doesn't crash and sorts predictably.
  if (!dateString || typeof dateString !== 'string') {
    return new Date(0);
  }
  const parts = dateString.split('/');
  if (parts.length !== 3) {
    return new Date(0);
  }
  const [day, month, year] = parts.map(Number);
  // Basic validation
  if (isNaN(day) || isNaN(month) || isNaN(year) || year < 1970 || month < 1 || month > 12 || day < 1 || day > 31) {
    return new Date(0);
  }
  // The month is 0-indexed in the JS Date constructor
  const date = new Date(year, month - 1, day);
  // Check for invalid date creations (e.g., new Date('2024', 1, 30) for Feb 30)
  if (isNaN(date.getTime())) {
    return new Date(0);
  }
  return date;
};

// Helper to format a JS Date object into HH:mm format, ignoring timezone.
const formatDateToHHMM = (value: any): string => {
    // If it's already a string in a time-like format (HH:mm or HH:mm - HH:mm), leave it.
    if (typeof value === 'string' && /^\d{2}:\d{2}( - \d{2}:\d{2})?$/.test(value)) {
        return value;
    }
    if (value instanceof Date && !isNaN(value.getTime())) {
        const hours = String(value.getUTCHours()).padStart(2, '0');
        const minutes = String(value.getUTCMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }
    return String(value ?? '').trim();
};

// Helper to format a JS Date object into DD/MM/YYYY format, ignoring timezone.
const formatDateToDDMMYYYY = (value: any): string => {
    if (typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
        return value;
    }
    if (value instanceof Date && !isNaN(value.getTime())) {
        const day = String(value.getUTCDate()).padStart(2, '0');
        const month = String(value.getUTCMonth() + 1).padStart(2, '0');
        const year = value.getUTCFullYear();
        return `${day}/${month}/${year}`;
    }
    return String(value ?? '').trim();
};


export const loadDataFromLocalStorage = (): { aulas: AulaEntry[], events: Event[] } => {
    const aulasData = localStorage.getItem(AULAS_KEY);
    const eventsData = localStorage.getItem(EVENTS_KEY);

    const rawAulas = aulasData ? JSON.parse(aulasData) : [];
    const rawEvents = eventsData ? JSON.parse(eventsData) : [];

    // Sanitize data on load to ensure type consistency, fixing issues with old stored data.
    const aulas: AulaEntry[] = rawAulas.map((row: any) => ({
        periodo: String(row.periodo ?? '').trim(),
        modulo: String(row.modulo ?? '').trim(),
        grupo: String(row.grupo ?? '').trim(),
        dia_semana: String(row.dia_semana ?? '').trim(),
        disciplina: String(row.disciplina ?? '').trim(),
        professor: String(row.professor ?? '').trim(),
        sala: String(row.sala ?? '').trim(),
        horario_inicio: formatDateToHHMM(row.horario_inicio),
        horario_fim: formatDateToHHMM(row.horario_fim),
    }));

    const events: Event[] = rawEvents.map((row: any) => ({
        periodo: String(row.periodo ?? '').trim(),
        data: formatDateToDDMMYYYY(row.data),
        horario: formatDateToHHMM(row.horario),
        disciplina: String(row.disciplina ?? '').trim(),
        tipo: String(row.tipo ?? '').trim(),
        local: String(row.local ?? '').trim(),
        modulo: String(row.modulo ?? '').trim(),
        grupo: String(row.grupo ?? '').trim(),
    }));

    return { aulas, events };
}


const groupAulasIntoSchedule = (aulas: AulaEntry[]): Schedule => {
    const scheduleMap: { [key: string]: DiaDeAula } = {};
    const weekOrder = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

    aulas.forEach(aulaEntry => {
        const dia = aulaEntry.dia_semana;
        if (!scheduleMap[dia]) {
            scheduleMap[dia] = { dia: dia, aulas: [] };
        }

        const aula: Aula = {
            horario: `${aulaEntry.horario_inicio} - ${aulaEntry.horario_fim}`,
            disciplina: aulaEntry.disciplina,
            professor: aulaEntry.professor,
            sala: aulaEntry.sala,
            modulo: aulaEntry.modulo,
        };
        scheduleMap[dia].aulas.push(aula);
    });

    const finalSchedule = Object.values(scheduleMap);

    finalSchedule.forEach(day => {
        day.aulas.sort((a, b) => a.horario.localeCompare(b.horario));
    });

    finalSchedule.sort((a, b) => weekOrder.indexOf(a.dia) - weekOrder.indexOf(b.dia));

    return finalSchedule;
};


export const fetchSchedule = (periodo: string, selections: Omit<ModuleSelection, 'id'>[], allAulas: AulaEntry[]): Schedule | null => {
    const matchingAulas = allAulas.filter(aula => 
        aula.periodo === periodo &&
        selections.some(sel => sel.modulo === aula.modulo && sel.grupo === aula.grupo)
    );

    if (matchingAulas.length === 0) return null;

    return groupAulasIntoSchedule(matchingAulas);
};

export const getUniqueModulesForPeriod = (periodo: string, allAulas: AulaEntry[]): string[] => {
    const modulesForPeriod = allAulas
        .filter(entry => entry.periodo === periodo)
        .map(entry => entry.modulo);
        
    const uniqueModules = [...new Set(modulesForPeriod)];
    uniqueModules.sort();
    return uniqueModules;
};

export const fetchEvents = (periodo: string, selections: Omit<ModuleSelection, 'id'>[], allEvents: Event[]): Event[] | null => {
    const matchingEvents = allEvents.filter(event => {
        const isGeneralEvent = event.periodo === 'Geral';
        const isPeriodSpecificEvent = 
            event.periodo === periodo &&
            selections.some(sel => 
                sel.modulo === event.modulo && (event.grupo === sel.grupo || event.grupo === 'Todos')
            );
        return isPeriodSpecificEvent || isGeneralEvent;
    });

    if (matchingEvents.length === 0) return null;
    
    const uniqueEvents = matchingEvents.filter((event, index, self) =>
        index === self.findIndex((e) => (
            e.data === event.data && e.disciplina === event.disciplina && e.tipo === event.tipo && e.modulo === event.modulo
        ))
    );

    uniqueEvents.sort((a, b) => parseBrDate(a.data).getTime() - parseBrDate(b.data).getTime());

    return uniqueEvents;
};

export const getUniquePeriods = (allAulas: AulaEntry[]): string[] => {
    const periods = allAulas.map(entry => entry.periodo);
    const uniquePeriods = [...new Set(periods)];
    
    uniquePeriods.sort((a, b) => {
        const numA = parseInt(a, 10);
        const numB = parseInt(b, 10);
        if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
        }
        return a.localeCompare(b);
    });
    
    return uniquePeriods;
};

export const getUniqueGroupsForModule = (periodo: string, modulo: string, allAulas: AulaEntry[]): string[] => {
    const groups = allAulas
        .filter(entry => entry.periodo === periodo && entry.modulo === modulo)
        .map(entry => entry.grupo);
    
    const uniqueGroups = [...new Set(groups)];
    uniqueGroups.sort();
    return uniqueGroups;
};


export const updateDataFromExcel = async (file: File): Promise<{ aulasData: AulaEntry[], eventsData: Event[] }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                
                const aulasSheet = workbook.Sheets['Aulas'];
                const avaliacoesSheet = workbook.Sheets['Avaliacoes'];
                const eventosSheet = workbook.Sheets['Eventos'];

                if (!aulasSheet) {
                  return reject(new Error("Aba 'Aulas' não encontrada na planilha."));
                }
                
                const rawAulasData = XLSX.utils.sheet_to_json(aulasSheet);
                
                const aulasData: AulaEntry[] = rawAulasData.map((row: any): AulaEntry => ({
                    periodo: String(row.periodo ?? '').trim(),
                    modulo: String(row.modulo ?? '').trim(),
                    grupo: String(row.grupo ?? '').trim(),
                    dia_semana: String(row.dia_semana ?? '').trim(),
                    disciplina: String(row.disciplina ?? '').trim(),
                    professor: String(row.professor ?? '').trim(),
                    sala: String(row.sala ?? '').trim(),
                    horario_inicio: formatDateToHHMM(row.horario_inicio),
                    horario_fim: formatDateToHHMM(row.horario_fim),
                }));
                
                let eventsData: Event[] = [];
                if (avaliacoesSheet) {
                    eventsData = eventsData.concat(XLSX.utils.sheet_to_json(avaliacoesSheet));
                }
                if (eventosSheet) {
                    eventsData = eventsData.concat(XLSX.utils.sheet_to_json(eventosSheet));
                }

                eventsData = eventsData.map((row: any): Event => ({
                    periodo: String(row.periodo ?? '').trim(),
                    data: formatDateToDDMMYYYY(row.data),
                    horario: formatDateToHHMM(row.horario),
                    disciplina: String(row.disciplina ?? '').trim(),
                    tipo: String(row.tipo ?? '').trim(),
                    local: String(row.local ?? '').trim(),
                    modulo: String(row.modulo ?? '').trim(),
                    grupo: String(row.grupo ?? '').trim(),
                }));

                // Validação de cabeçalhos
                if (aulasData.length > 0 && (!aulasData[0].dia_semana || !aulasData[0].horario_inicio)) {
                    return reject(new Error("Formato incorreto na aba 'Aulas'. Verifique os cabeçalhos das colunas."));
                }
                if (eventsData.length > 0 && (!eventsData[0].data || !eventsData[0].tipo)) {
                   return reject(new Error("Formato incorreto na aba 'Avaliacoes' ou 'Eventos'. Verifique os cabeçalhos."));
                }

                localStorage.setItem(AULAS_KEY, JSON.stringify(aulasData));
                localStorage.setItem(EVENTS_KEY, JSON.stringify(eventsData));

                resolve({ aulasData, eventsData });
            } catch (error) {
                console.error("Erro ao processar planilha:", error);
                reject(new Error('Falha ao ler o arquivo. Verifique se ele não está corrompido.'));
            }
        };
        reader.onerror = (error) => reject(new Error('Não foi possível ler o arquivo.'));
        reader.readAsArrayBuffer(file);
    });
};