export function createContactMailto(email: string, data: { name: string; email: string; subject: string; content: string }) {
  const body = `Nome: ${data.name}\r\nE-mail para resposta: ${data.email}\r\n\r\n${data.content}`;
  return `mailto:${email}?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(body)}`;
}
