
export const PERIODOS = [...Array.from({ length: 8 }, (_, i) => `${i + 1}º Período`)];
export const GRUPOS = ["Grupo A", "Grupo B", "Grupo C", "Grupo D"];

export const MODULE_COLORS: { [key: string]: string } = {
  "Módulo I": "border-l-afya-blue",
  "Módulo II": "border-l-afya-pink",
  "Módulo III": "border-l-sky-500",
  "Módulo IV": "border-l-rose-500",
  "Módulo V": "border-l-indigo-500",
  "Módulo VI": "border-l-fuchsia-500",
  "Módulo VII": "border-l-teal-500",
  "Módulo VIII": "border-l-purple-500",
  "N/A": "border-l-gray-400",
};

export const DEFAULT_MODULE_COLOR = "border-l-gray-500";