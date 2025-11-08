
export interface Aula {
  horario: string;
  disciplina: string;
  professor: string;
  sala: string;
  modulo: string;
  events?: Event[];
}

// Representa uma entrada de aula individual como está no aulas.json
export interface AulaEntry {
  periodo: string;
  modulo: string;
  grupo: string;
  dia_semana: string;
  horario_inicio: string;
  horario_fim: string;
  disciplina: string;
  professor: string;
  sala: string;
}

export interface DiaDeAula {
  dia: string;
  aulas: Aula[];
}

export type Schedule = DiaDeAula[];

export interface ModuleSelection {
  id: number;
  modulo: string;
  grupo: string;
}

export interface Event {
  periodo: string;
  data: string;
  horario: string;
  disciplina: string;
  tipo: string;
  local: string;
  modulo: string;
  grupo: string;
}
