const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export const formatScheduledDate = (date: Date): string => {
  return dateTimeFormatter.format(date);
};

export const formatDate = (date: Date): string => {
  return dateFormatter.format(date);
};
