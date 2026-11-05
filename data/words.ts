
export type Word = {
  id: number;
  spanish: string;
  georgian: string;
  lessonId: number;
};

export const lessons = [
  { id: 1, title: "გაკვეთილი 1", description: "ზედსართავი სახელები" },
  { id: 2, title: "გაკვეთილი 2", description: "სიტყვები" },
  { id: 3, title: "გაკვეთილი 3", description: "კითხვითი სიტყვები" },
];

export const words: Word[] = [
  // გაკვეთილი 1 — ზედსართავი სახელები
  { id: 1, spanish: "Moreno / Morena", georgian: "შავგვრემანი", lessonId: 1 },
  { id: 2, spanish: "Rubio / Rubia", georgian: "ქერა", lessonId: 1 },
  { id: 3, spanish: "Gordo / Gorda", georgian: "მსუქანი", lessonId: 1 },
  { id: 4, spanish: "Delgado / Delgada", georgian: "გამხდარი", lessonId: 1 },
  { id: 5, spanish: "Alto / Alta", georgian: "მაღალი", lessonId: 1 },
  { id: 6, spanish: "Bajo / Baja", georgian: "დაბალი", lessonId: 1 },
  { id: 7, spanish: "Inglés / Inglesa", georgian: "ინგლისელი", lessonId: 1 },
  { id: 8, spanish: "Simpático / Simpática", georgian: "სასიამოვნო", lessonId: 1 },
  { id: 9, spanish: "Antipático / Antipática", georgian: "არასასიამოვნო", lessonId: 1 },
  { id: 10, spanish: "Caro / Cara", georgian: "ძვირი", lessonId: 1 },
  { id: 11, spanish: "Barato / Barata", georgian: "იაფი", lessonId: 1 },
  { id: 12, spanish: "Grande", georgian: "დიდი", lessonId: 1 },
  { id: 13, spanish: "Pequeño / Pequeña", georgian: "პატარა", lessonId: 1 },
  { id: 14, spanish: "Malo / Mala", georgian: "ცუდი", lessonId: 1 },
  { id: 15, spanish: "Bueno / Buena", georgian: "კარგი", lessonId: 1 },

  // გაკვეთილი 2 — სიტყვები
  { id: 16, spanish: "Gato", georgian: "კატა", lessonId: 2 },
  { id: 17, spanish: "Perro", georgian: "ძაღლი", lessonId: 2 },
  { id: 18, spanish: "Agua", georgian: "წყალი", lessonId: 2 },
  { id: 19, spanish: "Leche", georgian: "რძე", lessonId: 2 },
  { id: 20, spanish: "Pan", georgian: "პური", lessonId: 2 },
  { id: 21, spanish: "Papá", georgian: "მამა", lessonId: 2 },
  { id: 22, spanish: "Libro", georgian: "წიგნი", lessonId: 2 },
  { id: 23, spanish: "Casa", georgian: "სახლი", lessonId: 2 },
  { id: 24, spanish: "Maleta", georgian: "ჩემოდანი", lessonId: 2 },
  { id: 25, spanish: "Verde", georgian: "მწვანე", lessonId: 2 },
  { id: 26, spanish: "Azul", georgian: "ლურჯი", lessonId: 2 },
  { id: 27, spanish: "Grande", georgian: "დიდი", lessonId: 2 },
  { id: 28, spanish: "Quieres", georgian: "გინდა", lessonId: 2 },
  { id: 29, spanish: "Hilo", georgian: "ძაფი", lessonId: 2 },
  { id: 30, spanish: "Quiere", georgian: "მას უნდა", lessonId: 2 },
  { id: 31, spanish: "Querer", georgian: "ნდომა, სიყვარული", lessonId: 2 },
  { id: 32, spanish: "Helado", georgian: "ნაყინი", lessonId: 2 },
  { id: 33, spanish: "Yo", georgian: "მე", lessonId: 2 },
  { id: 34, spanish: "Con", georgian: "ერთად, -თან", lessonId: 2 },
  { id: 35, spanish: "Sin", georgian: "გარეშე", lessonId: 2 },
  { id: 36, spanish: "Buscar", georgian: "ძებნა", lessonId: 2 },

  // გაკვეთილი 3 — კითხვითი სიტყვები
  { id: 37, spanish: "¿Qué?", georgian: "რა?", lessonId: 3 },
  { id: 38, spanish: "¿Qué comes?", georgian: "რას ჭამ?", lessonId: 3 },
  { id: 39, spanish: "¿Quién?", georgian: "ვინ?", lessonId: 3 },
  { id: 40, spanish: "¿Quiénes?", georgian: "ვინები?", lessonId: 3 },
  { id: 41, spanish: "¿Quién habla?", georgian: "ვინ ლაპარაკობს?", lessonId: 3 },
  { id: 42, spanish: "¿Dónde?", georgian: "სად?", lessonId: 3 },
  { id: 43, spanish: "¿Adónde?", georgian: "საით?", lessonId: 3 },
  { id: 44, spanish: "¿Dónde vives?", georgian: "სად ცხოვრობ?", lessonId: 3 },
  { id: 45, spanish: "¿Cuándo?", georgian: "როდის?", lessonId: 3 },
  { id: 46, spanish: "¿Cuándo descansas?", georgian: "როდის ისვენებ?", lessonId: 3 },
  { id: 47, spanish: "¿Por qué?", georgian: "რატომ?", lessonId: 3 },
  { id: 48, spanish: "¿Por qué no trabajas?", georgian: "რატომ არ მუშაობ?", lessonId: 3 },
  { id: 49, spanish: "Porque", georgian: "იმიტომ რომ", lessonId: 3 },
  { id: 50, spanish: "¿Cómo?", georgian: "როგორ?", lessonId: 3 },
  { id: 51, spanish: "¿Cómo te llamas?", georgian: "რა გქვია?", lessonId: 3 },
  { id: 52, spanish: "¿Cuánto?", georgian: "რამდენი?", lessonId: 3 },
];
