const Calculator = {
  activeCurrency: 'usd',
  decimals: 3,
  _rate: 0,
  _isUpdating: false,

  setDecimals(n) {
    this.decimals = Math.max(2, Math.min(5, Math.round(n)));
  },

  format(n) {
    if (isNaN(n) || n === null || n === undefined) return '0';
    const fixed = n.toFixed(this.decimals);
    const parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return parts.join(',');
  },

  parse(str) {
    if (!str || typeof str !== 'string') return 0;
    const cleaned = str.replace(/\./g, '').replace(',', '.');
    const val = parseFloat(cleaned);
    return isNaN(val) ? 0 : val;
  },

  setRate(rate) {
    this._rate = rate || 0;
  },

  getRate() {
    return this._rate;
  },

  convertToBs(amount) {
    return amount * this._rate;
  },

  convertFromBs(amount) {
    return this._rate ? amount / this._rate : 0;
  },

  getCurrencySymbol(currency) {
    const symbols = { usd: '$', eur: '€', usdt: '₮' };
    return symbols[currency] || '$';
  },

  getCurrencyLabel(currency) {
    const labels = { usd: 'USD', eur: 'EUR', usdt: 'USDT' };
    return labels[currency] || 'USD';
  }
};
