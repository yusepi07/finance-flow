const Store = {
  KEY: 'financeflow',

  _namespace(key) {
    return `${this.KEY}_${key}`;
  },

  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(this._namespace(key));
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(this._namespace(key), JSON.stringify(value));
    } catch (e) {
      console.warn('Store: Error al guardar', key, e);
    }
  },

  remove(key) {
    localStorage.removeItem(this._namespace(key));
  },

  // --- Config ---
  getConfig() {
    return this.get('config', { decimales: 3, darkMode: false });
  },

  saveConfig(config) {
    this.set('config', config);
  },

  // --- Tasas cacheadas ---
  getCachedRates() {
    return this.get('rates', null);
  },

  saveRates(rates) {
    this.set('rates', {
      data: rates,
      fetchedAt: new Date().toISOString(),
      lastUpdateOld: rates?.monitors?.usd?.last_update_old || null,
      lastUpdate: rates?.monitors?.usd?.last_update || null,
    });
  },

  // --- Última actualización registrada ---
  getLastFetchDate() {
    const cached = this.get('rates', null);
    return cached?.fetchedAt ? new Date(cached.fetchedAt) : null;
  },

  // --- Tasas personalizadas ---
  getCustomRates() {
    return this.get('customRates', null);
  },

  saveCustomRates(rates) {
    this.set('customRates', rates);
  },

  getUseCustomRates() {
    return this.get('useCustom', false);
  },

  setUseCustomRates(val) {
    this.set('useCustom', val);
  },

  // --- Snapshot historial ---
  addHistorySnapshot(fecha, usd, eur) {
    const history = this.get('history', []);
    const existente = history.findIndex(h => h.fecha === fecha);
    const entry = { fecha, usd, eur, recordedAt: new Date().toISOString() };
    if (existente >= 0) {
      history[existente] = entry;
    } else {
      history.push(entry);
    }
    this.set('history', history);
  },

  getHistory() {
    return this.get('history', []);
  },

  // --- Última vez que se mostró notice de lunes bancario ---
  getLastBankNotice() {
    return this.get('lastBankNotice', null);
  },

  setLastBankNotice(date) {
    this.set('lastBankNotice', date);
  }
};
