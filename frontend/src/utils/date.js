/**
 * MiniLedger 2.0 - Native Date Utility Library
 * Clean, lightweight, reliable, zero external dependencies
 */

export const formatDate = (dateInput) => {
  if (!dateInput) return '-';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '-';
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return '-';
  }
};

export const formatDateTime = (dateInput) => {
  if (!dateInput) return '-';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '-';
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return '-';
  }
};

export const toInputDateFormat = (dateInput = new Date()) => {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDaysRemainingOrOverdue = (dueDateInput) => {
  if (!dueDateInput) return { text: 'No due date', days: 0, isOverdue: false, isToday: false };

  const due = new Date(dueDateInput);
  const now = new Date();

  const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffTime = dueMidnight.getTime() - nowMidnight.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const abs = Math.abs(diffDays);
    return {
      text: `${abs} day${abs === 1 ? '' : 's'} overdue`,
      days: abs,
      isOverdue: true,
      isToday: false,
      isTomorrow: false,
    };
  } else if (diffDays === 0) {
    return { text: 'Due Today', days: 0, isOverdue: false, isToday: true, isTomorrow: false };
  } else if (diffDays === 1) {
    return { text: 'Due Tomorrow', days: 1, isOverdue: false, isToday: false, isTomorrow: true };
  } else {
    return {
      text: `Due in ${diffDays} days`,
      days: diffDays,
      isOverdue: false,
      isToday: false,
      isTomorrow: false,
    };
  }
};

export const isDateOverdue = (dueDateInput) => {
  if (!dueDateInput) return false;
  const due = new Date(dueDateInput);
  const now = new Date();
  const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return dueMidnight < nowMidnight;
};
