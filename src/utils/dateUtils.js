// Date utility functions
export const toISODate = (d) => {
  const dt = (d instanceof Date) ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return new Date().toISOString().slice(0,10);
  return new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate())).toISOString().slice(0,10);
};

export const parseISODate = (iso) => {
  try {
    const [y,m,day] = (iso || '').split('-').map(Number);
    if (!y || !m || !day) return new Date();
    return new Date(y, m-1, day);
  } catch { return new Date(); }
};

export const getWeekStart = (d) => {
  const dt = new Date(d.getFullYear(), d.getMonth(), 1);
  const day = (dt.getDay() + 6) % 7; // Monday=0
  dt.setDate(dt.getDate() - day);
  return dt;
};

export const addDays = (d, n) => { 
  const x = new Date(d); 
  x.setDate(x.getDate() + n); 
  return x; 
};

export const isSameDay = (a, b) => 
  a.getFullYear() === b.getFullYear() && 
  a.getMonth() === b.getMonth() && 
  a.getDate() === b.getDate();

export const monthLabel = (d) => {
  const months = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
};

export const formatDate = (d) => d.toISOString().slice(0, 10);
