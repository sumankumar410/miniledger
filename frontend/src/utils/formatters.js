/**
 * Format a number or string into Indian Rupee format (e.g., ₹1,50,000.00)
 */
export const formatRupee = (amount) => {
  if (amount === undefined || amount === null) return '₹0.00';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0.00';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * Format ISO date string into readable format (e.g., 15 Nov 2026)
 */
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
};

/**
 * Calculates days remaining or days overdue
 */
export const getDueDateLabel = (dueDateString, isRepaid) => {
  if (isRepaid) {
    return { text: 'Repaid', isPast: false };
  }

  const due = new Date(dueDateString);
  const now = new Date();

  // Set times to midnight for date-only comparison
  const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffDays = Math.ceil((dueMidnight.getTime() - nowMidnight.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} overdue`, isPast: true };
  } else if (diffDays === 0) {
    return { text: 'Due today', isPast: false };
  } else if (diffDays === 1) {
    return { text: 'Due tomorrow', isPast: false };
  } else {
    return { text: `Due in ${diffDays} days`, isPast: false };
  }
};
