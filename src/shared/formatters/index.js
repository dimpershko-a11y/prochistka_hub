export const formatters = {
  money(value, currency = 'RUB') {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(Number(value || 0));
  },

  number(value) {
    return new Intl.NumberFormat('ru-RU').format(Number(value || 0));
  },

  area(value) {
    return `${this.number(value)} м²`;
  },

  date(value) {
    if (!value) return '';

    return new Intl.DateTimeFormat('ru-RU').format(new Date(value));
  },

  phone(value) {
    return String(value || '').trim();
  }
};
