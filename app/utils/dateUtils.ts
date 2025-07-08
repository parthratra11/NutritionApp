export const getCurrentWeekDates = () => {
  const today = new Date();
  const dayLetters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const dates = [];
  
  // Get previous 6 days and today
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    dates.push({
      day: dayLetters[date.getDay()],
      date: date.getDate().toString(),
      full: date,
      isToday: i === 0
    });
  }
  
  return dates;
};