export const MOCK_WORK_DAYS = [
  {
    id: '1',
    date: '2024-07-22',
    workDuration: '8h 15m',
    breakDuration: '45m',
    overtime: '+15m',
  },
  {
    id: '2',
    date: '2024-07-21',
    workDuration: '7h 30m',
    breakDuration: '1h 0m',
    overtime: '-30m',
  },
  {
    id: '3',
    date: '2024-07-20',
    workDuration: '9h 0m',
    breakDuration: '30m',
    overtime: '+1h 0m',
  },
   {
    id: '4',
    date: '2024-07-19',
    workDuration: '8h 0m',
    breakDuration: '1h 15m',
    overtime: '0m',
  },
   {
    id: '5',
    date: '2024-07-18',
    workDuration: '7h 45m',
    breakDuration: '45m',
    overtime: '-15m',
  },
];

export const MOCK_BREAKDOWN_DATA = [
    { type: "work", total: 320, fill: "var(--color-work)" },
    { type: "breaks", total: 80, fill: "var(--color-breaks)" },
]

export const MOCK_BREAK_TYPE_DATA = [
  { type: "coffee", count: 12, fill: "var(--color-coffee)" },
  { type: "lunch", count: 5, fill: "var(--color-lunch)" },
  { type: "walk", count: 8, fill: "var(--color-walk)" },
  { type: "other", count: 3, fill: "var(--color-other)" },
]

export const MOCK_LEARNING_SESSIONS = [
  {
    id: 'l1',
    date: '2024-07-22',
    goal: 'Understand React Server Components',
    duration: '1h 30m',
    completion: 90,
    topic: 'React',
  },
  {
    id: 'l2',
    date: '2024-07-21',
    goal: 'Learn about advanced TypeScript generics',
    duration: '45m',
    completion: 60,
    topic: 'TypeScript',
  },
    {
    id: 'l3',
    date: '2024-07-20',
    goal: 'Practice component design in Figma',
    duration: '2h 15m',
    completion: 100,
    topic: 'Figma',
  },
  {
    id: 'l4',
    date: '2024-07-19',
    goal: 'Build a small API with Go and Gin',
    duration: '3h 0m',
    completion: 40,
    topic: 'Go',
  },
];


export const MOCK_LEARNING_FOCUS = [
  { topic: "react", sessions: 18, fill: "var(--color-react)" },
  { topic: "typescript", sessions: 12, fill: "var(--color-typescript)" },
  { topic: "figma", sessions: 9, fill: "var(--color-figma)" },
  { topic: "go", sessions: 4, fill: "var(--color-go)" },
]

export const MOCK_LEARNING_COMPLETION = [
  { date: '2024-07-16', completion: 75 },
  { date: '2024-07-17', completion: 60 },
  { date: '2024-07-18', completion: 80 },
  { date: '2024-07-19', completion: 50 },
  { date: '2024-07-20', completion: 90 },
  { date: '2024-07-21', completion: 70 },
  { date: '2024-07-22', completion: 85 },
]
