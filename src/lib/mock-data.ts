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
