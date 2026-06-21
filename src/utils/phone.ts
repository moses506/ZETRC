export const ZAMBIA_PHONE_PREFIX = '+260';

export function sanitizePhoneInput(value: string): string {
  return value.replace(/[^\d\s]/g, '');
}

export function normalizeZambiaPhone(value: string): string {
  const digits = value.replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  let local = digits;

  if (local.startsWith('260')) {
    local = local.slice(3);
  }

  if (local.startsWith('0')) {
    local = local.slice(1);
  }

  return `${ZAMBIA_PHONE_PREFIX}${local}`;
}
