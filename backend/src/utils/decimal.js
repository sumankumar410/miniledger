const Decimal = require('decimal.js');

// Configure Decimal precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

const toDecimal = (val) => {
  if (val === null || val === undefined) return new Decimal(0);
  return new Decimal(val.toString());
};

const formatMoney = (val) => {
  return toDecimal(val).toFixed(2);
};

const sumDecimals = (items) => {
  const sum = items.reduce((acc, curr) => acc.plus(toDecimal(curr)), new Decimal(0));
  return sum.toFixed(2);
};

module.exports = {
  Decimal,
  toDecimal,
  formatMoney,
  sumDecimals,
};
