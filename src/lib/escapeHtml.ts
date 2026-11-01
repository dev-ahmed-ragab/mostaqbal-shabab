/**
 * تهريب HTML مركزي لمنع XSS المخزّن عند بناء قوالب الطباعة/PDF.
 * استخدمها على كل قيمة قادمة من المستخدم أو قاعدة البيانات قبل إدراجها في HTML.
 */
const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}
