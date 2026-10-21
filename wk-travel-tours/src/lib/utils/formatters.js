/**
 * Formats an integer amount as PKR currency string
 * @param {number} amount
 * @returns {string}
 */
export function formatPKR(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) return 'PKR 0';
  return `PKR ${Math.round(amount).toLocaleString('en-PK')}`;
}

/**
 * Builds a clean WhatsApp messaging URL
 * @param {string} phone 
 * @param {string} message 
 * @returns {string}
 */
export function buildWhatsAppUrl(phone, message) {
  let cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
    cleanPhone = '92' + cleanPhone.slice(1);
  }
  const encodedText = message ? encodeURIComponent(message) : '';
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

