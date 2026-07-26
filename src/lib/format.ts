const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const fullDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export function formatDate(value: string, full = false) {
  const date = new Date(value);
  return (full ? fullDateFormatter : dateFormatter).format(date).replace(" de ", " ");
}
