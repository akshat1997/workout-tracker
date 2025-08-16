export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const convertWeight = (weight: number, from: 'kg' | 'lb', to: 'kg' | 'lb'): number => {
  if (from === to) return weight;
  if (from === 'kg' && to === 'lb') return weight * 2.20462;
  if (from === 'lb' && to === 'kg') return weight / 2.20462;
  return weight;
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const getDayName = (dayIndex: number): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex];
};

export const getCurrentDayOfWeek = (): number => {
  return new Date().getDay();
};
