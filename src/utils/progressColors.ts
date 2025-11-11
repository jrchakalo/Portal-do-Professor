export const getOccupancyColor = (percent: number): string => {
  if (percent < 40) return "#3b82f6"; // Azul (turma bem vazia)
  if (percent < 70) return "#facc15"; // Amarelo (meio cheia)
  return "#ef4444"; // Vermelho (lotando / cheia)
};

export const getEngagementColor = (percent: number): string => {
  if (percent < 40) return "#ef4444"; // Vermelho (baixo engajamento)
  if (percent < 70) return "#facc15"; // Amarelo (mediano)
  return "#16a34a"; // Verde (bom)
};