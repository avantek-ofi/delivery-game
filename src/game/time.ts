const MINUTES_PER_DAY = 24 * 60
const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export function formatGameTime(totalMinutes: number) {
  const daysPassed = Math.floor(totalMinutes / MINUTES_PER_DAY)
  const minuteOfDay = Math.floor(totalMinutes % MINUTES_PER_DAY)
  const dayOfMonth = (daysPassed % 30) + 1
  const monthIndex = Math.floor(daysPassed / 30) % 12
  const weekday = DAYS[daysPassed % DAYS.length]
  const hour = Math.floor(minuteOfDay / 60).toString().padStart(2, '0')
  const minute = (minuteOfDay % 60).toString().padStart(2, '0')
  return { weekday, dayOfMonth, month: MONTHS[monthIndex], clock: `${hour}:${minute}`, day: daysPassed + 1 }
}
