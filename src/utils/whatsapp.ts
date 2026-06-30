/** ZETRC WhatsApp: 0978087286 */
export const ZETRC_WHATSAPP_E164 = '260978087286';
export const ZETRC_WHATSAPP_DISPLAY = '+260 97 808 7286';

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${ZETRC_WHATSAPP_E164}?text=${encodeURIComponent(message)}`;
}

export function openWhatsApp(message: string): void {
  window.open(buildWhatsAppUrl(message), '_blank', 'noopener,noreferrer');
}
