export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date) {
  if (!date) return '';
  try {
    return new Date(date).toLocaleString();
  } catch (e) {
    return String(date);
  }
}
