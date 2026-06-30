const Api = {
  MAIN_URL: 'https://api.dolaraldiavzla.com/api/v1/tipo-cambio',
  HIST_USD: 'https://ve.dolarapi.com/v1/historicos/dolares/oficial/',
  HIST_EUR: 'https://ve.dolarapi.com/v1/historicos/euros/oficial/',

  async fetchAll() {
    const res = await fetch(this.MAIN_URL, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return await res.json();
  },

  async fetchHistoricalUSD(dateStr) {
    const res = await fetch(`${this.HIST_USD}${dateStr}`);
    if (!res.ok) throw new Error('No hay datos USD para esa fecha');
    return await res.json();
  },

  async fetchHistoricalEUR(dateStr) {
    const res = await fetch(`${this.HIST_EUR}${dateStr}`);
    if (!res.ok) throw new Error('No hay datos EUR para esa fecha');
    return await res.json();
  }
};
