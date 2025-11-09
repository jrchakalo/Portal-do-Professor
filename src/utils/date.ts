const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export const formatScheduledDate = (date: Date): string => {
  return dateTimeFormatter.format(date);
};
