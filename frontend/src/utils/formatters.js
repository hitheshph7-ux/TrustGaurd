export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  } catch (e) {
    return dateString;
  }
}

export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function getRiskBadgeConfig(riskLevel) {
  const level = (riskLevel || '').toLowerCase();
  if (level === 'high') {
    return {
      bg: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
      pill: 'bg-rose-500 text-white',
      dot: 'bg-rose-500',
      label: 'HIGH RISK',
      gradient: 'from-rose-500 to-red-600'
    };
  } else if (level === 'medium') {
    return {
      bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      pill: 'bg-amber-500 text-white',
      dot: 'bg-amber-500',
      label: 'MEDIUM RISK',
      gradient: 'from-amber-400 to-amber-600'
    };
  } else {
    return {
      bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      pill: 'bg-emerald-500 text-white',
      dot: 'bg-emerald-500',
      label: 'LOW RISK',
      gradient: 'from-emerald-400 to-teal-500'
    };
  }
}
