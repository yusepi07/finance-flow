/* ====================================================
   FinanceFlow - PWA Principal
   ==================================================== */

const App = {
  state: {
    activeTab: 'principal',
    activeCurrency: 'usd',
    useNextRate: false,
    rates: null,
    config: {},
    customRates: null,
    useCustom: false,
    lastFetchDate: null,
    refreshCount: 0,
    refreshTimer: null,
    usdtTimer: null
  },

  els: {},

  /* ---------- Init ---------- */
  init() {
    this.state.config = Store.getConfig();
    this.state.customRates = Store.getCustomRates();
    this.state.useCustom = Store.getUseCustomRates();
    Calculator.setDecimals(this.state.config.decimales || 3);
    this.state.activeTab = 'principal';
    this.createDOM();
    this.bindEvents();
    this.applyTheme();
    this.loadData();
    this.startUSDTAutoRefresh();
  },

  /* ---------- Crear DOM ---------- */
  createDOM() {
    const app = document.getElementById('app');
    app.className =
      'h-dvh flex flex-col transition-colors duration-300 ' +
      (this.state.config.darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900');

    app.innerHTML = `
      <!-- ===== HEADER ===== -->
      <header id="header" class="shrink-0 px-4 pt-4 pb-2 border-b ${this.state.config.darkMode ? 'border-slate-700' : 'border-slate-200'}">
        <div class="flex items-center justify-between mb-1">
          <h1 class="text-lg font-bold tracking-tight">FinanceFlow</h1>
          <button id="themeBtn" class="text-xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors" title="Cambiar tema">
            ${this.state.config.darkMode ? '☀️' : '🌙'}
          </button>
        </div>
        <div class="flex items-center justify-between">
          <label id="toggleContainer" class="flex items-center gap-2 cursor-pointer select-none">
            <div class="relative">
              <input type="checkbox" id="toggleCheck" class="sr-only peer">
              <div class="w-9 h-5 rounded-full ${this.state.config.darkMode ? 'bg-slate-600' : 'bg-slate-300'} peer-checked:bg-blue-600 transition-colors"></div>
              <div class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow peer-checked:translate-x-4 transition-transform"></div>
            </div>
            <span id="toggleLabel" class="text-xs font-medium">Tasa actual</span>
          </label>
          <span id="toggleRateInfo" class="text-xs opacity-60">—</span>
        </div>
      </header>

      <!-- ===== MAIN CONTENT ===== -->
      <main class="flex-1 flex flex-col overflow-hidden">

        <!-- Tab: Principal -->
        <div id="tab-principal" class="flex-1 flex flex-col px-4 pt-3 gap-2 overflow-hidden">
          <!-- CHIPS -->
          <div class="flex justify-center gap-2">
            <button class="chip px-5 py-1.5 rounded-full text-sm font-semibold transition-all border-2 hover:bg-blue-600/20 hover:border-blue-400" data-currency="usd">$ BCV</button>
            <button class="chip px-5 py-1.5 rounded-full text-sm font-semibold transition-all border-2 hover:bg-blue-600/20 hover:border-blue-400" data-currency="eur">€ BCV</button>
            <button class="chip px-5 py-1.5 rounded-full text-sm font-semibold transition-all border-2 hover:bg-blue-600/20 hover:border-blue-400" data-currency="usdt">₮ USDT</button>
          </div>

          <!-- CALCULATOR -->
          <div class="flex-1 flex flex-col items-center justify-center">
            <div id="calculatorBox"
              class="w-full max-w-xs rounded-2xl p-5 flex flex-col items-center gap-1 transition-colors ${this.state.config.darkMode ? 'bg-slate-800/40' : 'bg-slate-100'}">
              <div class="w-full">
                <input id="inputTop" type="text" inputmode="decimal"
                  class="w-full bg-transparent text-right text-4xl font-mono outline-none border-b-2 ${this.state.config.darkMode ? 'border-slate-600 text-slate-100 placeholder:text-slate-600' : 'border-slate-300 text-slate-900 placeholder:text-slate-400'} transition-colors"
                  placeholder="$" autocomplete="off">
              </div>
              <span id="currencyIcon" class="text-xl leading-none font-bold opacity-30 select-none">⇄</span>
              <div class="w-full">
                <input id="inputBottom" type="text" inputmode="decimal"
                  class="w-full bg-transparent text-right text-4xl font-mono outline-none border-b-2 ${this.state.config.darkMode ? 'border-slate-600 text-slate-100 placeholder:text-slate-600' : 'border-slate-300 text-slate-900 placeholder:text-slate-400'} transition-colors"
                  placeholder="Bs" autocomplete="off">
              </div>
            </div>
          </div>

          <!-- MINI-CARDS -->
          <div class="flex justify-center gap-3 pb-1">
            <div class="mini-card flex flex-col items-center px-3 py-1.5 rounded-xl cursor-default transition-colors ${this.state.config.darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white shadow-sm hover:bg-slate-100'}" data-currency="usd">
              <span class="text-[10px] uppercase opacity-50">$ USD</span>
              <span id="mcard-usd-price" class="text-sm font-bold font-mono">—</span>
              <span id="mcard-usd-change" class="text-[10px] font-medium">—</span>
            </div>
            <div class="mini-card flex flex-col items-center px-3 py-1.5 rounded-xl cursor-default transition-colors ${this.state.config.darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white shadow-sm hover:bg-slate-100'}" data-currency="eur">
              <span class="text-[10px] uppercase opacity-50">€ EUR</span>
              <span id="mcard-eur-price" class="text-sm font-bold font-mono">—</span>
              <span id="mcard-eur-change" class="text-[10px] font-medium">—</span>
            </div>
            <div class="mini-card flex flex-col items-center px-3 py-1.5 rounded-xl cursor-default transition-colors ms-4 ${this.state.config.darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white shadow-sm hover:bg-slate-100'}" data-currency="usdt">
              <span class="text-[10px] uppercase opacity-50">₮ USDT</span>
              <span id="mcard-usdt-price" class="text-sm font-bold font-mono">—</span>
              <span id="mcard-usdt-change" class="text-[10px] font-medium">—</span>
            </div>
          </div>

          <!-- FOOTER -->
          <div class="flex items-center justify-between pb-2 text-[10px] opacity-50">
            <span id="lastUpdateLabel">Últ. actualización: —</span>
            <button id="refreshBtn" class="flex items-center gap-1 hover:opacity-100 transition-opacity disabled:opacity-30" title="Actualizar tasas">
              <span id="refreshIcon">🔄</span>
              <span id="refreshText">Actualizar</span>
            </button>
          </div>

          <!-- BANK HOLIDAY NOTICE -->
          <div id="bankNotice" class="hidden mb-1 px-3 py-1.5 rounded-lg text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-between">
            <span id="bankNoticeText"></span>
            <button id="bankNoticeClose" class="ml-2 text-xs opacity-60 hover:opacity-100">✕</button>
          </div>
        </div>

        <!-- Tab: Historial (hidden) -->
        <div id="tab-historial" class="hidden flex-1 flex flex-col px-4 pt-3 gap-3 overflow-hidden">
          <div class="flex gap-2">
            <button id="histModeDay" class="flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all border-2 hover:bg-blue-600/20 hover:border-blue-400">Día</button>
            <button id="histModeRange" class="flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all border-2 hover:bg-blue-600/20 hover:border-blue-400">Rango</button>
          </div>
          <div id="histDayPicker" class="flex gap-2 items-center">
            <input id="histDate" type="date" class="flex-1 px-3 py-1.5 rounded-lg text-sm border ${this.state.config.darkMode ? 'bg-slate-800 border-slate-600 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}">
            <button id="histSearchBtn" class="px-4 py-1.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors">Buscar</button>
          </div>
          <div id="histRangePicker" class="hidden gap-2 items-center flex-wrap">
            <input id="histDateFrom" type="date" class="flex-1 min-w-28 px-3 py-1.5 rounded-lg text-sm border ${this.state.config.darkMode ? 'bg-slate-800 border-slate-600 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}">
            <span class="text-xs opacity-50">→</span>
            <input id="histDateTo" type="date" class="flex-1 min-w-28 px-3 py-1.5 rounded-lg text-sm border ${this.state.config.darkMode ? 'bg-slate-800 border-slate-600 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}">
            <button id="histRangeSearchBtn" class="px-4 py-1.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors">Buscar</button>
          </div>
          <div id="histResults" class="flex-1 overflow-y-auto no-scrollbar space-y-1">
            <p class="text-xs opacity-40 text-center pt-8">Selecciona una fecha para consultar</p>
          </div>
        </div>

        <!-- Tab: Ajustes (hidden) -->
        <div id="tab-ajustes" class="hidden flex-1 flex flex-col px-4 pt-3 gap-4 overflow-hidden">
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm">Decimales</span>
              <select id="decimalSelect" class="px-3 py-1 rounded-lg text-sm border ${this.state.config.darkMode ? 'bg-slate-800 border-slate-600 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}">
                <option value="2">2</option>
                <option value="3" selected>3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm">Tema oscuro</span>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" id="darkModeToggle" ${this.state.config.darkMode ? 'checked' : ''} class="sr-only peer">
                <div class="w-9 h-5 rounded-full ${this.state.config.darkMode ? 'bg-blue-600' : 'bg-slate-300'} peer-checked:bg-blue-600 transition-colors"></div>
                <div class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow peer-checked:translate-x-4 transition-transform"></div>
              </label>
            </div>
          </div>
          <div class="border-t ${this.state.config.darkMode ? 'border-slate-700' : 'border-slate-200'} pt-3 space-y-2">
            <p class="text-xs opacity-40">FinanceFlow v1.0</p>
            <p class="text-xs opacity-40">Datos: dolaraldiavzla.com · dolarapi.com</p>
          </div>
          <div class="border-t ${this.state.config.darkMode ? 'border-slate-700' : 'border-slate-200'} pt-3">
            <p class="text-xs opacity-40 mb-1">Próximamente</p>
            <p class="text-xs opacity-30">• Perfil de usuario</p>
            <p class="text-xs opacity-30">• Notificaciones personalizadas</p>
          </div>
        </div>

        <!-- Tab: Personalizada (hidden - push view) -->
        <div id="tab-personalizada" class="hidden flex-1 flex flex-col px-4 pt-3 gap-3 overflow-hidden">
          <div class="flex items-center gap-2 mb-2">
            <button id="persBackBtn" class="text-lg leading-none w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">←</button>
            <span class="text-sm font-semibold">Calculadora Personalizada</span>
          </div>
          <p class="text-[10px] opacity-40 mb-1">Edita las tasas manualmente para usar en la calculadora principal.</p>
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <span class="w-12 text-sm font-semibold">$ USD</span>
              <input id="customUsd" type="text" inputmode="decimal" class="flex-1 px-3 py-1.5 rounded-lg text-sm font-mono border ${this.state.config.darkMode ? 'bg-slate-800 border-slate-600 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}">
            </div>
            <div class="flex items-center gap-3">
              <span class="w-12 text-sm font-semibold">€ EUR</span>
              <input id="customEur" type="text" inputmode="decimal" class="flex-1 px-3 py-1.5 rounded-lg text-sm font-mono border ${this.state.config.darkMode ? 'bg-slate-800 border-slate-600 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}">
            </div>
            <div class="flex items-center gap-3">
              <span class="w-12 text-sm font-semibold">₮ USDT</span>
              <input id="customUsdt" type="text" inputmode="decimal" class="flex-1 px-3 py-1.5 rounded-lg text-sm font-mono border ${this.state.config.darkMode ? 'bg-slate-800 border-slate-600 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}">
            </div>
          </div>
          <div class="flex gap-2 mt-2">
            <button id="persSaveBtn" class="flex-1 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors">Guardar tasas</button>
            <button id="persResetBtn" class="px-4 py-2 rounded-xl text-sm font-semibold border ${this.state.config.darkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-300 text-slate-600 hover:bg-slate-100'} transition-colors">Restaurar API</button>
          </div>
          <label class="flex items-center gap-2 text-xs opacity-60 cursor-pointer mt-1">
            <input type="checkbox" id="persUseToggle" ${this.state.useCustom ? 'checked' : ''}>
            Usar estas tasas en la calculadora
          </label>
        </div>
      </main>

      <!-- ===== BOTTOM NAV ===== -->
      <nav class="shrink-0 flex border-t ${this.state.config.darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}">
        <button class="nav-item flex-1 flex flex-col items-center py-2 text-[10px] font-medium transition-colors" data-tab="principal">
          <span class="text-base">🏠</span>
          <span>Principal</span>
        </button>
        <button class="nav-item flex-1 flex flex-col items-center py-2 text-[10px] font-medium transition-colors" data-tab="historial">
          <span class="text-base">📈</span>
          <span>Historial</span>
        </button>
        <button class="nav-item flex-1 flex flex-col items-center py-2 text-[10px] font-medium transition-colors" data-tab="ajustes">
          <span class="text-base">⚙️</span>
          <span>Ajustes</span>
        </button>
        <button class="nav-item flex-1 flex flex-col items-center py-2 text-[10px] font-medium transition-colors" data-tab="personalizada">
          <span class="text-base">⚡</span>
          <span>Personal</span>
        </button>
      </nav>
    `;

    // Store references
    this.els = {
      app,
      toggleCheck: app.querySelector('#toggleCheck'),
      toggleLabel: app.querySelector('#toggleLabel'),
      toggleRateInfo: app.querySelector('#toggleRateInfo'),
      themeBtn: app.querySelector('#themeBtn'),
      calculatorBox: app.querySelector('#calculatorBox'),
      inputTop: app.querySelector('#inputTop'),
      inputBottom: app.querySelector('#inputBottom'),
      currencyIcon: app.querySelector('#currencyIcon'),
      chips: app.querySelectorAll('.chip[data-currency]'),
      mcard: {
        usd: { price: app.querySelector('#mcard-usd-price'), change: app.querySelector('#mcard-usd-change') },
        eur: { price: app.querySelector('#mcard-eur-price'), change: app.querySelector('#mcard-eur-change') },
        usdt: { price: app.querySelector('#mcard-usdt-price'), change: app.querySelector('#mcard-usdt-change') },
      },
      lastUpdateLabel: app.querySelector('#lastUpdateLabel'),
      refreshBtn: app.querySelector('#refreshBtn'),
      refreshIcon: app.querySelector('#refreshIcon'),
      refreshText: app.querySelector('#refreshText'),
      bankNotice: app.querySelector('#bankNotice'),
      bankNoticeText: app.querySelector('#bankNoticeText'),
      bankNoticeClose: app.querySelector('#bankNoticeClose'),
      navItems: app.querySelectorAll('.nav-item'),
      tabs: {
        principal: app.querySelector('#tab-principal'),
        historial: app.querySelector('#tab-historial'),
        ajustes: app.querySelector('#tab-ajustes'),
        personalizada: app.querySelector('#tab-personalizada'),
      },
      // Historial
      histModeDay: app.querySelector('#histModeDay'),
      histModeRange: app.querySelector('#histModeRange'),
      histDayPicker: app.querySelector('#histDayPicker'),
      histRangePicker: app.querySelector('#histRangePicker'),
      histDate: app.querySelector('#histDate'),
      histDateFrom: app.querySelector('#histDateFrom'),
      histDateTo: app.querySelector('#histDateTo'),
      histSearchBtn: app.querySelector('#histSearchBtn'),
      histRangeSearchBtn: app.querySelector('#histRangeSearchBtn'),
      histResults: app.querySelector('#histResults'),
      // Ajustes
      decimalSelect: app.querySelector('#decimalSelect'),
      darkModeToggle: app.querySelector('#darkModeToggle'),
      // Personalizada
      persBackBtn: app.querySelector('#persBackBtn'),
      customUsd: app.querySelector('#customUsd'),
      customEur: app.querySelector('#customEur'),
      customUsdt: app.querySelector('#customUsdt'),
      persSaveBtn: app.querySelector('#persSaveBtn'),
      persResetBtn: app.querySelector('#persResetBtn'),
      persUseToggle: app.querySelector('#persUseToggle'),
    };

    // Set decimal select to current value
    this.els.decimalSelect.value = String(this.state.config.decimales || 3);

    // Formatear input con separadores de miles al escribir
    this._setupInputFormatting(this.els.inputTop);
    this._setupInputFormatting(this.els.inputBottom);

    // Activar primer chip
    this._activateChip('usd');
    this._activateNav('principal');
  },

  /* ---------- Formateo de inputs ---------- */
  _setupInputFormatting(input) {
    let cursorPos = 0;
    input.addEventListener('focus', (e) => {
      // Si es 0, limpiar
      if (this._getRawValue(input) === 0) {
        input.value = '';
      }
    });

    input.addEventListener('input', (e) => {
      if (this._isUpdating) return;
      const raw = this._getRawValue(input);
      if (raw === 0 && input.value === '') return;
      this._updateFromInput(input);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        input.blur();
      }
      // Allow: backspace, delete, tab, escape, enter, arrow keys
      const allowed = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
      if (allowed.includes(e.key)) return;
      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return;
      // Allow: digits, one comma, one dot
      if (/^\d$/.test(e.key)) return;
      if ((e.key === ',' || e.key === '.') && !input.value.includes(',') && !input.value.includes('.')) return;
      e.preventDefault();
    });
  },

  _getRawValue(input) {
    const val = input.value.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  },

  _formatInput(value) {
    if (value === 0 || value === '0' || !value) return '';
    const parts = value.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return parts.join(',');
  },

  _isUpdating: false,

  _updateFromInput(source) {
    this._isUpdating = true;
    const top = this.els.inputTop;
    const bottom = this.els.inputBottom;

    if (source === top) {
      const val = this._getRawValue(top);
      const bs = Calculator.convertToBs(val);
      bottom.value = Calculator.format(bs);
    } else {
      const val = this._getRawValue(bottom);
      const converted = Calculator.convertFromBs(val);
      top.value = Calculator.format(converted);
    }
    this._isUpdating = false;
  },

  /* ---------- Eventos ---------- */
  bindEvents() {
    // Toggle next rate
    this.els.toggleCheck.addEventListener('change', () => {
      this.state.useNextRate = this.els.toggleCheck.checked;
      this._updateToggleLabel();
      this._updateCalculatorRate();
      this._updateMiniCards();
    });

    // Theme
    this.els.themeBtn.addEventListener('click', () => this.toggleTheme());

    // Chips
    this.els.chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const currency = chip.dataset.currency;
        this._activateChip(currency);
        this.state.activeCurrency = currency;
        this.els.currencyIcon.textContent = Calculator.getCurrencySymbol(currency);
        // Reset calculator
        this.els.inputTop.value = '';
        this.els.inputBottom.value = '';
        this._updateCalculatorRate();
      });
    });

    // Refresh
    this.els.refreshBtn.addEventListener('click', () => this.handleRefresh());

    // Tab navigation
    this.els.navItems.forEach(item => {
      item.addEventListener('click', () => this.switchTab(item.dataset.tab));
    });

    // Historial modes
    this.els.histModeDay.addEventListener('click', () => this._setHistMode('day'));
    this.els.histModeRange.addEventListener('click', () => this._setHistMode('range'));
    this.els.histSearchBtn.addEventListener('click', () => this._searchHistoryDay());
    this.els.histRangeSearchBtn.addEventListener('click', () => this._searchHistoryRange());

    // Allow Enter on date inputs
    this.els.histDate.addEventListener('keydown', (e) => { if (e.key === 'Enter') this._searchHistoryDay(); });
    this.els.histDateFrom.addEventListener('keydown', (e) => { if (e.key === 'Enter') this._searchHistoryRange(); });
    this.els.histDateTo.addEventListener('keydown', (e) => { if (e.key === 'Enter') this._searchHistoryRange(); });

    // Ajustes
    this.els.decimalSelect.addEventListener('change', () => {
      const val = parseInt(this.els.decimalSelect.value);
      this.state.config.decimales = val;
      Calculator.setDecimals(val);
      Store.saveConfig(this.state.config);
      this._updateMiniCards();
      // Recalculate current values
      if (this.els.inputTop.value || this.els.inputBottom.value) {
        this._updateFromInput(
          this.els.inputTop.value ? this.els.inputTop : this.els.inputBottom
        );
      }
    });

    this.els.darkModeToggle.addEventListener('change', () => {
      this.state.config.darkMode = this.els.darkModeToggle.checked;
      Store.saveConfig(this.state.config);
      this.applyTheme();
    });

    // Personalizada
    this.els.persBackBtn.addEventListener('click', () => this.switchTab('principal'));
    this.els.persSaveBtn.addEventListener('click', () => this._saveCustomRates());
    this.els.persResetBtn.addEventListener('click', () => this._resetCustomRates());
    this.els.persUseToggle.addEventListener('change', () => {
      Store.setUseCustomRates(this.els.persUseToggle.checked);
      this.state.useCustom = this.els.persUseToggle.checked;
      if (!this.state.useCustom) {
        this._loadFromAPI();
      } else {
        this._applyCustomRates();
      }
    });

    // Bank notice close
    this.els.bankNoticeClose.addEventListener('click', () => {
      this.els.bankNotice.classList.add('hidden');
      Store.setLastBankNotice(new Date().toDateString());
    });
  },

  /* ---------- Chips ---------- */
  _activateChip(currency) {
    this.els.chips.forEach(chip => {
      const isActive = chip.dataset.currency === currency;
      chip.classList.toggle('border-blue-600', isActive);
      chip.classList.toggle('text-blue-500', isActive);
      chip.classList.toggle('bg-blue-600/10', isActive);
      chip.classList.toggle('border-transparent', !isActive);
      chip.classList.toggle('opacity-60', !isActive);
    });
    // Update placeholder del input superior según moneda activa
    this.els.inputTop.placeholder = Calculator.getCurrencySymbol(currency);
  },

  /* ---------- Nav ---------- */
  _activateNav(tab) {
    const dark = this.state.config.darkMode;
    this.els.navItems.forEach(item => {
      const isActive = item.dataset.tab === tab;
      item.className =
        'nav-item flex-1 flex flex-col items-center py-2 text-[10px] font-medium transition-colors' +
        (isActive
          ? (dark
              ? ' text-blue-400 bg-blue-500/10 rounded-xl'
              : ' text-blue-600 bg-blue-600/10 rounded-xl')
          : ' opacity-40 hover:opacity-100');
    });
  },

  switchTab(tab) {
    // Hide all tabs
    Object.entries(this.els.tabs).forEach(([key, el]) => {
      el.classList.toggle('hidden', key !== tab);
    });

    this.state.activeTab = tab;
    this._activateNav(tab);

    // Load custom rates when entering personalizada tab
    if (tab === 'personalizada') {
      this._loadCustomRatesUI();
    }
  },

  /* ---------- Toggle ---------- */
  _updateToggleLabel() {
    const on = this.state.useNextRate;
    this.els.toggleLabel.textContent = on ? 'Tasa siguiente día' : 'Tasa actual';
    this.els.toggleCheck.checked = on;
  },

  _updateCalculatorRate() {
    const currency = this.state.activeCurrency;
    let rate = 0;
    const label = this.els.toggleRateInfo;

    if (this.state.useCustom && this.state.customRates?.[currency]) {
      rate = this.state.customRates[currency];
      label.textContent = `Tasa personalizada: ${Calculator.format(rate)} Bs`;
    } else if (this.state.rates?.monitors?.[currency]) {
      const m = this.state.rates.monitors[currency];
      const val = this.state.useNextRate ? m.price : m.price_old;
      rate = val;
      const dateLabel = this.state.useNextRate
        ? `Próx (${m.last_update})`
        : `Actual (${m.last_update_old})`;
      label.textContent = `${Calculator.getCurrencySymbol(currency)} ${Calculator.format(rate)} Bs · ${dateLabel}`;
    } else {
      label.textContent = '—';
    }

    Calculator.setRate(rate);
    // Recalculate if inputs have values
    if (this.els.inputTop.value || this.els.inputBottom.value) {
      const source = this.els.inputTop.value ? this.els.inputTop : this.els.inputBottom;
      // Trigger with slight delay to let rate update
      setTimeout(() => this._updateFromInput(source), 0);
    }
  },

  /* ---------- Mini cards ---------- */
  _updateMiniCards() {
    ['usd', 'eur', 'usdt'].forEach(currency => {
      const m = this.state.rates?.monitors?.[currency];
      const card = this.els.mcard[currency];
      if (!m) {
        card.price.textContent = '—';
        card.change.textContent = '—';
        return;
      }
      // In mini-cards we always show the CURRENT rate (price_old)
      // No afectado por toggle
      const price = m.price_old || m.price;
      card.price.textContent = Calculator.format(price);

      const symbol = m.color === 'green' ? '▲' : '▼';
      const colorClass = m.color === 'green' ? 'text-green-500' : 'text-red-500';
      card.change.textContent = `${symbol} ${m.change > 0 ? '+' : ''}${m.change.toFixed(2)}`;
      card.change.className = `text-[10px] font-medium ${colorClass}`;
    });

    this._updateToggleLabel();
    this._updateCalculatorRate();
  },

  /* ---------- Carga de datos ---------- */
  async loadData() {
    const cached = Store.getCachedRates();
    if (cached?.data) {
      this.state.rates = cached.data;
      this._applyRates();
    }

    // Always try to fetch fresh data
    try {
      const data = await Api.fetchAll();
      this.state.rates = data;
      Store.saveRates(data);
      this._applyRates();
      this._checkBankHoliday();
      this._saveDailySnapshot(data);
      this._hideToast();
    } catch (err) {
      if (!cached?.data) {
        this._showToast('Error al conectar. Sin datos disponibles.', true);
      }
    }
  },

  _applyRates() {
    this._updateMiniCards();
    this._updateCalculatorRate();
    this._updateFooter();
    this._loadCustomRatesUI(); // Pre-fill custom with current values
  },

  _updateFooter() {
    const cached = Store.getCachedRates();
    const m = this.state.rates?.monitors?.usd;
    let label = 'Últ. actualización: —';
    if (m?.last_update_old) {
      label = `Últ. act: ${m.last_update_old}`;
    } else if (cached?.fetchedAt) {
      const d = new Date(cached.fetchedAt);
      label = `Últ. act: ${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    this.els.lastUpdateLabel.textContent = label;
  },

  /* ---------- Refresh ---------- */
  async handleRefresh() {
    const now = new Date();
    this.state.refreshCount++;

    // Spam protection
    if (this.state.refreshCount > 2 && this.state.refreshTimer) {
      const elapsed = (now - this.state.refreshTimer) / 1000;
      if (elapsed < 60) {
        this._showToast('El BCV actualiza 1 vez al día. Esta tasa regirá el resto del día.', true);
        return;
      }
    }

    if (!this.state.refreshTimer) {
      this.state.refreshTimer = now;
    }

    // Desactivar botón visualmente
    this.els.refreshBtn.disabled = true;
    this.els.refreshIcon.textContent = '⏳';
    this.els.refreshText.textContent = 'Actualizando...';

    try {
      // Check if we already have today's rate
      const cached = Store.getCachedRates();
      const m = cached?.data?.monitors?.usd;
      if (m) {
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const lastUpdateDate = m.last_update_old ? m.last_update_old.split(',')[0] : '';
        const parsed = this._parseDateStr(lastUpdateDate);

        if (parsed === todayStr) {
          this._showToast('Tasa ya actualizada hoy. Cargando datos guardados...');
          // Still show as "refreshed" from cache
          this._applyRates();
          this.els.refreshIcon.textContent = '✅';
          this.els.refreshText.textContent = 'Actualizado';
          setTimeout(() => {
            this.els.refreshIcon.textContent = '🔄';
            this.els.refreshText.textContent = 'Actualizar';
            this.els.refreshBtn.disabled = false;
          }, 2000);
          return;
        }
      }

      // Real fetch
      const data = await Api.fetchAll();
      this.state.rates = data;
      Store.saveRates(data);
      this._applyRates();
      this._checkBankHoliday();
      this._saveDailySnapshot(data);

      this.els.refreshIcon.textContent = '✅';
      this.els.refreshText.textContent = '¡Actualizado!';
      setTimeout(() => {
        this.els.refreshIcon.textContent = '🔄';
        this.els.refreshText.textContent = 'Actualizar';
        this.els.refreshBtn.disabled = false;
      }, 2000);
    } catch (err) {
      this.els.refreshIcon.textContent = '❌';
      this.els.refreshText.textContent = 'Error';
      this._showToast('Error al actualizar. Revisa tu conexión.', true);
      setTimeout(() => {
        this.els.refreshIcon.textContent = '🔄';
        this.els.refreshText.textContent = 'Actualizar';
        this.els.refreshBtn.disabled = false;
      }, 2000);
    }
  },

  _parseDateStr(dateStr) {
    // "26/06/2026, 12:00 AM" -> "2026-06-26"
    if (!dateStr) return '';
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parts[0].trim();
      const month = parts[1].trim();
      const year = parts[2].split(',')[0].trim();
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateStr;
  },

  /* ---------- USDT auto-refresh ---------- */
  startUSDTAutoRefresh() {
    // Refresh USDT every 2 hours
    this.usdtTimer = setInterval(async () => {
      try {
        const data = await Api.fetchAll();
        if (this.state.rates?.monitors?.usdt) {
          this.state.rates.monitors.usdt = data.monitors.usdt;
        }
        this._updateMiniCards();
      } catch {
        // Silently fail - keep last known rate
      }
    }, 2 * 60 * 60 * 1000);
  },

  /* ---------- Theme ---------- */
  toggleTheme() {
    this.state.config.darkMode = !this.state.config.darkMode;
    this.els.darkModeToggle.checked = this.state.config.darkMode;
    Store.saveConfig(this.state.config);
    this.applyTheme();
  },

  applyTheme() {
    const dark = this.state.config.darkMode;
    const root = document.documentElement;

    // Toggle dark class on html
    root.classList.toggle('dark', dark);

    // App background
    this.els.app.className =
      'h-dvh flex flex-col transition-colors duration-300 ' +
      (dark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900');

    // Theme button
    this.els.themeBtn.textContent = dark ? '☀️' : '🌙';

    // Nav background
    const nav = this.els.app.querySelector('nav');
    if (nav) {
      nav.className =
        'shrink-0 flex border-t transition-colors duration-300 ' +
        (dark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200');
    }

    // Input borders
    this.els.inputTop.className =
      'w-full bg-transparent text-right text-4xl font-mono outline-none border-b-2 transition-colors ' +
      (dark ? 'border-slate-600 text-slate-100 placeholder:text-slate-600' : 'border-slate-300 text-slate-900 placeholder:text-slate-400');

    this.els.inputBottom.className =
      'w-full bg-transparent text-right text-4xl font-mono outline-none border-b-2 transition-colors ' +
      (dark ? 'border-slate-600 text-slate-100 placeholder:text-slate-600' : 'border-slate-300 text-slate-900 placeholder:text-slate-400');

    // Header border
    const header = this.els.app.querySelector('#header');
    if (header) {
      header.className = `shrink-0 px-4 pt-4 pb-2 border-b transition-colors ${dark ? 'border-slate-700' : 'border-slate-200'}`;
    }

    // Mini-cards — store references first time, reuse on subsequent toggles
    if (!this.els._miniCardEls) {
      this.els._miniCardEls = [...this.els.app.querySelectorAll('[data-currency]')]
        .filter(el => el.matches('.mini-card') || (
          el.classList.contains('flex') &&
          el.querySelector('[id^="mcard-"]')
        ));
    }
    this.els._miniCardEls.forEach(card => {
      card.className =
        'mini-card flex flex-col items-center px-3 py-1.5 rounded-xl cursor-default transition-colors ' +
        (dark ? 'bg-slate-800 hover:bg-slate-700 text-slate-100' : 'bg-white shadow-sm hover:bg-slate-100 text-slate-900');
    });

    // Toggle background
    const toggleBg = this.els.app.querySelector('#toggleContainer .rounded-full:not(.absolute)');
    if (toggleBg) {
      toggleBg.className =
        'w-9 h-5 rounded-full transition-colors ' +
        (dark ? 'bg-slate-600' : 'bg-slate-300') +
        ' peer-checked:bg-blue-600';
    }

    // Pers inputs
    [this.els.customUsd, this.els.customEur, this.els.customUsdt, this.els.histDate, this.els.histDateFrom, this.els.histDateTo].forEach(el => {
      if (el) {
        el.className =
          `flex-1 px-3 py-1.5 rounded-lg text-sm font-mono border outline-none transition-colors ` +
          (dark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'bg-white border-slate-300 text-slate-900');
      }
    });

    // Ajustes inputs
    if (this.els.decimalSelect) {
      this.els.decimalSelect.className =
        `px-3 py-1 rounded-lg text-sm border outline-none transition-colors ` +
        (dark ? 'bg-slate-800 border-slate-600 text-slate-100' : 'bg-white border-slate-300 text-slate-900');
    }

    // Personalizada reset btn
    if (this.els.persResetBtn) {
      this.els.persResetBtn.className =
        `px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ` +
        (dark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-300 text-slate-600 hover:bg-slate-100');
    }

    // Nav active state
    this._activateNav(this.state.activeTab);

    // Calculator box
    if (this.els.calculatorBox) {
      this.els.calculatorBox.className =
        'w-full max-w-xs rounded-2xl p-5 flex flex-col items-center gap-1 transition-colors ' +
        (dark ? 'bg-slate-800/40' : 'bg-slate-100');
    }
  },

  /* ---------- Toast ---------- */
  _toastTimeout: null,

  _showToast(msg, isError = false) {
    // Check if toast exists, create if not
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className =
        'fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-sm font-medium shadow-lg transition-all duration-300 ' +
        (this.state.config.darkMode ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-900');
      document.body.appendChild(toast);
    }

    toast.textContent = msg;
    toast.className =
      `fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-sm font-medium shadow-lg transition-all duration-300 ` +
      (isError ? 'bg-red-500/90 text-white' : this.state.config.darkMode ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-900');

    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%, -10px)';
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translate(-50%, 0)';
    });

    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%, -10px)';
    }, 3000);
  },

  _hideToast() {
    const toast = document.getElementById('toast');
    if (toast) {
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%, -10px)';
    }
  },

  /* ---------- Bank Holiday ---------- */
  _checkBankHoliday() {
    const m = this.state.rates?.monitors?.usd;
    if (!m?.last_update) return;

    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun

    // Only check on Fridays (5) or when we detect an upcoming Tuesday next rate
    const lastUpdate = m.last_update;
    const updateParts = lastUpdate.split(',')[0].trim().split('/'); // "30/06/2026"
    if (updateParts.length === 3) {
      const updateDay = parseInt(updateParts[0]);
      const updateMonth = parseInt(updateParts[1]) - 1;
      const updateYear = parseInt(updateParts[2]);
      const updateDate = new Date(updateYear, updateMonth, updateDay);
      const updateDayOfWeek = updateDate.getDay();

      // If next rate takes effect on Tuesday, Monday is a bank holiday
      if (updateDayOfWeek === 2) { // Tuesday
        const lastNotice = Store.getLastBankNotice();
        const todayStr = today.toDateString();
        if (lastNotice === todayStr) return; // Already shown today

        this.els.bankNoticeText.textContent =
          '🛑 Lunes es feriado bancario. La tasa del viernes se mantiene hasta el lunes. La próxima actualización será el martes.';
        this.els.bankNotice.classList.remove('hidden');
      }
    }

    // Also check if today is Monday and next rate is Tuesday (bank holiday today)
    if (dayOfWeek === 1) { // Monday
      if (updateParts.length === 3) {
        const updateDay = parseInt(updateParts[0]);
        const updateMonth = parseInt(updateParts[1]) - 1;
        const updateYear = parseInt(updateParts[2]);
        const updateDate = new Date(updateYear, updateMonth, updateDay);
        if (updateDate.getDay() === 2) { // Tuesday
          this.els.bankNoticeText.textContent =
            '🛑 Hoy es feriado bancario. La tasa del viernes sigue vigente. Mañana se actualizará.';
          this.els.bankNotice.classList.remove('hidden');
        }
      }
    }

    // Always log the notice date
    Store.setLastBankNotice(today.toDateString());
  },

  /* ---------- History Snapshot ---------- */
  _saveDailySnapshot(data) {
    const m = data?.monitors;
    if (!m?.usd || !m?.eur) return;
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    Store.addHistorySnapshot(dateStr, m.usd.price_old, m.eur.price_old);
  },

  /* ---------- Historial ---------- */
  _setHistMode(mode) {
    const isDay = mode === 'day';
    this.els.histModeDay.classList.toggle('border-blue-600', isDay);
    this.els.histModeDay.classList.toggle('text-blue-500', isDay);
    this.els.histModeDay.classList.toggle('bg-blue-600/10', isDay);
    this.els.histModeDay.classList.toggle('border-transparent', !isDay);
    this.els.histModeDay.classList.toggle('opacity-60', !isDay);

    this.els.histModeRange.classList.toggle('border-blue-600', !isDay);
    this.els.histModeRange.classList.toggle('text-blue-500', !isDay);
    this.els.histModeRange.classList.toggle('bg-blue-600/10', !isDay);
    this.els.histModeRange.classList.toggle('border-transparent', isDay);
    this.els.histModeRange.classList.toggle('opacity-60', isDay);

    this.els.histDayPicker.classList.toggle('hidden', !isDay);
    this.els.histRangePicker.classList.toggle('hidden', isDay);
  },

  async _searchHistoryDay() {
    const dateVal = this.els.histDate.value;
    if (!dateVal) {
      this._showToast('Selecciona una fecha', true);
      return;
    }
    // Convert YYYY-MM-DD to YYYY/MM/DD
    const parts = dateVal.split('-');
    const apiDate = `${parts[0]}/${parts[1]}/${parts[2]}`;

    this.els.histResults.innerHTML = '<p class="text-xs opacity-40 text-center pt-8">Cargando...</p>';

    try {
      const [usd, eur] = await Promise.all([
        Api.fetchHistoricalUSD(apiDate),
        Api.fetchHistoricalEUR(apiDate)
      ]);

      const usdPrice = usd.promedio || usd.venta || usd.compra || 'N/A';
      const eurPrice = eur.promedio || eur.venta || eur.compra || 'N/A';
      const fechaDisplay = usd.fecha || dateVal;

      this.els.histResults.innerHTML = `
        <div class="p-3 rounded-xl ${this.state.config.darkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}">
          <p class="text-xs opacity-50 mb-2">${fechaDisplay}</p>
          <div class="flex justify-around">
            <div class="text-center">
              <p class="text-xs opacity-50">$ USD</p>
              <p class="text-lg font-bold font-mono">${typeof usdPrice === 'number' ? Calculator.format(usdPrice) : usdPrice}</p>
            </div>
            <div class="text-center">
              <p class="text-xs opacity-50">€ EUR</p>
              <p class="text-lg font-bold font-mono">${typeof eurPrice === 'number' ? Calculator.format(eurPrice) : eurPrice}</p>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      this.els.histResults.innerHTML = `<p class="text-xs text-red-500 text-center pt-8">No hay datos para esa fecha</p>`;
    }
  },

  async _searchHistoryRange() {
    const fromVal = this.els.histDateFrom.value;
    const toVal = this.els.histDateTo.value;
    if (!fromVal || !toVal) {
      this._showToast('Selecciona ambas fechas', true);
      return;
    }
    if (fromVal > toVal) {
      this._showToast('La fecha "desde" debe ser anterior a "hasta"', true);
      return;
    }

    this.els.histResults.innerHTML = '<p class="text-xs opacity-40 text-center pt-8">Cargando...</p>';

    try {
      // Build date range
      const from = new Date(fromVal + 'T00:00:00');
      const to = new Date(toVal + 'T00:00:00');
      const dates = [];
      const current = new Date(from);
      while (current <= to) {
        const y = current.getFullYear();
        const m = String(current.getMonth() + 1).padStart(2, '0');
        const d = String(current.getDate()).padStart(2, '0');
        dates.push(`${y}/${m}/${d}`);
        current.setDate(current.getDate() + 1);
      }

      // Fetch all in parallel with limit
      const MAX = 31;
      const batch = dates.slice(0, MAX);
      const results = await Promise.allSettled(
        batch.map(async (date) => {
          const [usd, eur] = await Promise.all([
            Api.fetchHistoricalUSD(date),
            Api.fetchHistoricalEUR(date)
          ]);
          const displayDate = usd.fecha || date.replace(/\//g, '-');
          return {
            fecha: displayDate,
            usd: usd.promedio || 'N/A',
            eur: eur.promedio || 'N/A'
          };
        })
      );

      const rows = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value);

      if (rows.length === 0) {
        this.els.histResults.innerHTML = `<p class="text-xs opacity-40 text-center pt-8">Sin datos en este rango</p>`;
        return;
      }

      this.els.histResults.innerHTML = rows.map(r => `
        <div class="flex items-center justify-between px-3 py-1.5 rounded-lg ${this.state.config.darkMode ? 'bg-slate-800/50' : 'bg-white/50'}">
          <span class="text-xs opacity-50 w-28">${r.fecha}</span>
          <span class="text-sm font-mono font-bold w-24 text-right">$ ${typeof r.usd === 'number' ? Calculator.format(r.usd) : r.usd}</span>
          <span class="text-sm font-mono font-bold w-24 text-right">€ ${typeof r.eur === 'number' ? Calculator.format(r.eur) : r.eur}</span>
        </div>
      `).join('');

      if (dates.length > MAX) {
        const more = document.createElement('p');
        more.className = 'text-xs opacity-30 text-center pt-2';
        more.textContent = `Mostrando ${MAX} de ${dates.length} días solicitados`;
        this.els.histResults.appendChild(more);
      }
    } catch (err) {
      this.els.histResults.innerHTML = `<p class="text-xs text-red-500 text-center pt-8">Error al consultar el historial</p>`;
    }
  },

  /* ---------- Custom Rates ---------- */
  _loadCustomRatesUI() {
    const rates = this.state.customRates || {};
    if (this.state.rates?.monitors) {
      const m = this.state.rates.monitors;
      this.els.customUsd.value = rates.usd !== undefined ? String(rates.usd) : (m.usd?.price_old || m.usd?.price || '');
      this.els.customEur.value = rates.eur !== undefined ? String(rates.eur) : (m.eur?.price_old || m.eur?.price || '');
      this.els.customUsdt.value = rates.usdt !== undefined ? String(rates.usdt) : (m.usdt?.price_old || m.usdt?.price || '');
    }
    this.els.persUseToggle.checked = this.state.useCustom;
  },

  _saveCustomRates() {
    const usd = parseFloat(this.els.customUsd.value.replace(',', '.'));
    const eur = parseFloat(this.els.customEur.value.replace(',', '.'));
    const usdt = parseFloat(this.els.customUsdt.value.replace(',', '.'));

    if (isNaN(usd) || isNaN(eur) || isNaN(usdt)) {
      this._showToast('Ingresa valores numéricos válidos', true);
      return;
    }

    const rates = { usd, eur, usdt };
    this.state.customRates = rates;
    Store.saveCustomRates(rates);
    this.state.useCustom = this.els.persUseToggle.checked;
    Store.setUseCustomRates(this.state.useCustom);

    if (this.state.useCustom) {
      this._applyCustomRates();
    }

    this._showToast('Tasas guardadas ✓');
  },

  _resetCustomRates() {
    if (this.state.rates?.monitors) {
      const m = this.state.rates.monitors;
      this.els.customUsd.value = m.usd?.price_old || m.usd?.price || '';
      this.els.customEur.value = m.eur?.price_old || m.eur?.price || '';
      this.els.customUsdt.value = m.usdt?.price_old || m.usdt?.price || '';
    }
  },

  _applyCustomRates() {
    // Override rates in calculator with custom values
    this._updateCalculatorRate();
    if (this.els.inputTop.value || this.els.inputBottom.value) {
      const source = this.els.inputTop.value ? this.els.inputTop : this.els.inputBottom;
      setTimeout(() => this._updateFromInput(source), 0);
    }
  },

  /* ---------- API fallback data load ---------- */
  async _loadFromAPI() {
    this.state.useCustom = false;
    Store.setUseCustomRates(false);
    try {
      const data = await Api.fetchAll();
      this.state.rates = data;
      Store.saveRates(data);
      this._applyRates();
    } catch {
      // Use cached if available
    }
  },
};

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => App.init());
