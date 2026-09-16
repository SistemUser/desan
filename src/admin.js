/**
 * Desan Konveyör & Mekanik İmalat
 * B2B Yönetim Paneli Core JavaScript Engine (src/admin.js)
 */

import './index.css';

(function () {
  'use strict';

  // ==========================================
  // SHARED MASTER STORE MANAGER (desan_master_store)
  // ==========================================
  const MASTER_KEY = 'desan_master_store';
  const COLLECTAPI_TOKEN = 'apikey 4CmmBPjDkpyG3PltxXg0k7:1aP2MFOOCLBvIk4HkSa5Jg';

  const DEFAULT_DB = {
    admin_credentials: {
      username: "desan",
      password: "654321"
    },
    currencies: {
      base: "TRY",
      selected: "TRY",
      rates: {
        TRY: 1.0,
        USD: 38.50,
        EUR: 42.20
      },
      symbols: {
        TRY: "₺",
        USD: "$",
        EUR: "€"
      },
      auto_sync: true,
      api_source: "open.er-api.com",
      last_updated: "2026-09-15"
    },
    exchange_rate: {
      usd_try: 38.50,
      eur_try: 42.20,
      last_updated: "2026-09-15",
      auto_sync: true,
      api_source: "open.er-api.com"
    },
    pricing_formulas: {
      belt_base_rates: { RUB: 4250, PVC: 2600, PU: 3800, GRP: 3400 },
      splice_costs: { SP: 1450, MK: 450, RO: 0 },
      roller_base_formula: "280 + (d * 2.1) + (L * 0.55) + (mil * 3) + coating_extra",
      b2b_discount_percent: 15,
      vat_percent: 20
    },
    quotes_archive: [],
    customer_accounts: [
      {
        id: "cari_001",
        tax_id: "1234567890",
        email: "satinasma@odsmadencilik.com.tr",
        company_name: "Ods Madencilik ve Lojistik A.Ş.",
        tax_office: "İlyasbey V.D.",
        address: "Organize Sanayi Bölgesi 4. Cadde No:12 Gebze/KOCAELİ",
        authorized_person: "Ahmet Yılmaz (Satınalma Md.)",
        phone: "+90 262 644 11 22",
        custom_discount_percent: 20
      },
      {
        id: "cari_002",
        tax_id: "9876543210",
        email: "info@kartalagrega.com.tr",
        company_name: "Kartal Agrega Madencilik San. Tic. Ltd. Şti.",
        tax_office: "Kartal V.D.",
        address: "Samandıra Mah. Fabrikalar Cad. No:8 Sancaktepe/İSTANBUL",
        authorized_person: "Mehmet Kartal",
        phone: "+90 216 311 00 99",
        custom_discount_percent: 15
      }
    ],
    products_stock: [
      { id: "P-101", name: "SNH 511-609 Yatak Gövdesi", category: "SNH Bloklar", stock_status: "in_stock", unit_price: 2180, bulk_price_10: 1980 },
      { id: "P-102", name: "UCP 208 Döküm Ayaklı Rulman", category: "UCP Yataklar", stock_status: "in_stock", unit_price: 450, bulk_price_10: 410 },
      { id: "P-103", name: "Poliüretan Primer Bant Sıyırıcı", category: "PU Sıyırıcılar", stock_status: "on_order", unit_price: 4200, bulk_price_10: 3800 },
      { id: "P-104", name: "UCF 210 Dört Cıvatalı Flanşlı Yatak", category: "UCF Flanşlar", stock_status: "in_stock", unit_price: 590, bulk_price_10: 520 },
      { id: "P-105", name: "H-Serisi Konik Germe Manşonu", category: "Manşon", stock_status: "in_stock", unit_price: 210, bulk_price_10: 180 },
      { id: "P-106", name: "Sekonder Karbür Uçlu Ağır Hizmet Sıyırıcı", category: "PU Sıyırıcılar", stock_status: "in_stock", unit_price: 8400, bulk_price_10: 7600 }
    ],
    service_appointments: [],
    site_settings: {
      trust_badges_text: "ISO 9001:2015 Sertifikalı | 7/24 Teknik Saha Desteği | İkitelli İmalat Tesisi",
      working_hours: "Pzt - Cmt: 08:00 - 18:30 (Pazar Nöbetçi Saha Servisi)",
      phone_gsm: "+90 532 707 52 81",
      whatsapp_no: "905327075281"
    }
  };

  function getDB() {
    try {
      const saved = localStorage.getItem(MASTER_KEY) || localStorage.getItem('desan_db');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.customer_accounts || parsed.customer_accounts.length === 0) {
          parsed.customer_accounts = DEFAULT_DB.customer_accounts;
          saveDB(parsed, true);
        }
        return parsed;
      }
    } catch (e) {
      console.warn('localStorage read error:', e);
    }
    return DEFAULT_DB;
  }

  function saveDB(db, silent = false) {
    try {
      localStorage.setItem(MASTER_KEY, JSON.stringify(db));
      localStorage.setItem('desan_db', JSON.stringify(db));
      if (!silent) {
        window.dispatchEvent(new CustomEvent('desan:master_sync', { detail: db }));
      }
    } catch (e) {
      console.warn('localStorage save error:', e);
    }
  }

  // Toast Notification
  function showToast(message, type = 'success') {
    let container = document.getElementById('desan-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'desan-toast-container';
      container.className = 'fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `px-4 py-3 rounded-lg shadow-lg font-mono text-xs flex items-center gap-2.5 transition-all duration-300 transform translate-y-2 opacity-0 pointer-events-auto ${
      type === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white border border-slate-700'
    }`;
    toast.innerHTML = `
      <span class="material-symbols-outlined text-[18px] ${type === 'error' ? 'text-rose-200' : 'text-emerald-400'}">
        ${type === 'error' ? 'error' : 'check_circle'}
      </span>
      <span>${message}</span>
    `;
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // ==========================================
  // AUTHENTICATION & LOGIN GUARD
  // ==========================================
  function initAdminAuth() {
    const loginOverlay = document.getElementById('admin-login-overlay');
    const loginForm = document.getElementById('admin-login-form');
    const loginUser = document.getElementById('login-username');
    const loginPass = document.getElementById('login-password');
    const loginErrBox = document.getElementById('login-error-box');
    const loginErrText = document.getElementById('login-error-text');
    const btnLogout = document.getElementById('btn-admin-logout');
    const loggedAdminName = document.getElementById('logged-admin-name');

    function checkAuthSession() {
      const activeAuth = localStorage.getItem('desan_admin_auth') || sessionStorage.getItem('desan_admin_session');
      if (activeAuth) {
        if (loginOverlay) loginOverlay.classList.add('hidden');
        if (loggedAdminName) loggedAdminName.textContent = activeAuth;
      } else {
        if (loginOverlay) loginOverlay.classList.remove('hidden');
      }
    }

    checkAuthSession();

    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const usernameInput = loginUser?.value.trim() || '';
        const passwordInput = loginPass?.value || '';

        const db = getDB();
        const creds = db.admin_credentials || DEFAULT_DB.admin_credentials;

        if (usernameInput === creds.username && passwordInput === creds.password) {
          localStorage.setItem('desan_admin_auth', usernameInput);
          sessionStorage.setItem('desan_admin_session', usernameInput);

          if (loginErrBox) loginErrBox.classList.add('hidden');
          if (loginOverlay) loginOverlay.classList.add('hidden');
          if (loggedAdminName) loggedAdminName.textContent = usernameInput;
          showToast(`Hoş geldiniz ${usernameInput}! Yönetim paneline giriş yapıldı.`);
        } else {
          if (loginErrBox && loginErrText) {
            loginErrText.textContent = 'Girdiğiniz kullanıcı adı veya şifre hatalı!';
            loginErrBox.classList.remove('hidden');
          }
        }
      });
    }

    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        localStorage.removeItem('desan_admin_auth');
        sessionStorage.removeItem('desan_admin_session');
        checkAuthSession();
        showToast('Yönetim oturumu kilitlendi ve kapatıldı.');
      });
    }
  }

  // ==========================================
  // SIDEBAR TAB SWITCHER
  // ==========================================
  function initSidebarTabs() {
    const sidebarBtns = document.querySelectorAll('#admin-sidebar-nav .sidebar-btn');
    const panels = document.querySelectorAll('.admin-panel');

    sidebarBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');

        sidebarBtns.forEach(b => b.classList.remove('sidebar-active'));
        btn.classList.add('sidebar-active');

        panels.forEach(panel => {
          if (panel.id === `module-${targetTab}`) {
            panel.classList.remove('hidden');
          } else {
            panel.classList.add('hidden');
          }
        });
      });
    });
  }

  // ==========================================
  // MODÜL 1: DÖVİZ & FİYATLANDIRMA MOTORU (open.er-api.com Canlı API & Manuel Mod)
  // ==========================================
  let activeRfqIdInModal = null;

  async function fetchAndRenderExchangeRates(force = false) {
    const db = getDB();
    const currencies = db.currencies || DEFAULT_DB.currencies;
    const rates = currencies.rates || { TRY: 1.0, USD: 38.50, EUR: 42.20 };
    const autoSync = force ? true : (currencies.auto_sync !== false && db.exchange_rate?.auto_sync !== false);

    const valLiveUsd = document.getElementById('val-live-usd');
    const valLiveEur = document.getElementById('val-live-eur');
    const valLastTime = document.getElementById('val-last-time');
    const headerUsdVal = document.getElementById('header-usd-val');
    const headerEurVal = document.getElementById('header-eur-val');
    const headerStatus = document.getElementById('header-rate-status');
    const toggleAutoSync = document.getElementById('toggle-auto-sync');
    const inputManualUsd = document.getElementById('input-manual-usd');
    const inputManualEur = document.getElementById('input-manual-eur');
    const autoSyncLabel = document.getElementById('label-auto-sync-status');
    const statusDot = document.getElementById('rate-status-dot');
    const pulseDot = document.getElementById('rate-pulse-dot');

    if (toggleAutoSync) {
      toggleAutoSync.checked = autoSync;
    }

    let currentUsd = rates.USD || 38.50;
    let currentEur = rates.EUR || 42.20;

    if (force || autoSync) {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-cache' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.rates && data.rates.TRY) {
            currentUsd = parseFloat(data.rates.TRY);
            const eurUsdRate = data.rates.EUR ? parseFloat(data.rates.EUR) : 0.915;
            currentEur = currentUsd / eurUsdRate;

            const nowIso = new Date().toISOString();
            const targetAutoSync = force ? true : autoSync;

            db.currencies = {
              ...currencies,
              rates: {
                TRY: 1.0,
                USD: currentUsd,
                EUR: currentEur
              },
              auto_sync: targetAutoSync,
              api_source: targetAutoSync ? 'open.er-api.com' : 'Manual',
              last_updated: nowIso
            };
            db.exchange_rate = {
              usd_try: currentUsd,
              eur_try: currentEur,
              last_updated: nowIso,
              auto_sync: targetAutoSync,
              api_source: targetAutoSync ? 'open.er-api.com' : 'Manual'
            };
            saveDB(db, true);

            localStorage.setItem('desan_rates', JSON.stringify({
              usd_try: currentUsd,
              eur_try: currentEur,
              last_updated: nowIso,
              timestamp: Date.now(),
              auto_sync: targetAutoSync,
              api_source: targetAutoSync ? 'open.er-api.com' : 'Manual'
            }));
          }
        }
      } catch (err) {
        console.warn('open.er-api.com fetch error:', err);
      }
    }

    const formattedUsd = currentUsd.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
    const formattedEur = currentEur.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';

    if (valLiveUsd) valLiveUsd.textContent = formattedUsd;
    if (valLiveEur) valLiveEur.textContent = formattedEur;
    if (headerUsdVal) headerUsdVal.textContent = formattedUsd;
    if (headerEurVal) headerEurVal.textContent = formattedEur;

    if (inputManualUsd && !inputManualUsd.matches(':focus')) inputManualUsd.value = currentUsd.toFixed(2);
    if (inputManualEur && !inputManualEur.matches(':focus')) inputManualEur.value = currentEur.toFixed(2);

    const lastUpdated = db.currencies?.last_updated || Date.now();
    const dateObj = new Date(lastUpdated);
    const timeStr = dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    if (valLastTime) valLastTime.textContent = timeStr;

    if (!autoSync) {
      if (headerStatus) headerStatus.textContent = 'Manuel Sabit';
      if (autoSyncLabel) autoSyncLabel.textContent = 'Durum: Manuel Kilitli';
      if (statusDot) statusDot.className = 'relative inline-flex rounded-full h-2 w-2 bg-amber-500';
      if (pulseDot) pulseDot.className = 'hidden';
    } else {
      if (headerStatus) headerStatus.textContent = 'Auto (15dk)';
      if (autoSyncLabel) autoSyncLabel.textContent = 'Durum: Aktif (15 dk)';
      if (statusDot) statusDot.className = 'relative inline-flex rounded-full h-2 w-2 bg-emerald-500';
      if (pulseDot) pulseDot.className = 'animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75';
    }
  }

  function updatePricingBadges(curr) {
    const symbolMap = { TRY: '₺', USD: '$', EUR: '€' };
    const symbol = symbolMap[curr] || '₺';

    const headerSymbol = document.getElementById('label-base-currency-symbol');
    if (headerSymbol) headerSymbol.textContent = symbol;

    document.querySelectorAll('.pricing-unit-badge').forEach(el => {
      el.textContent = symbol + '/m';
    });
    document.querySelectorAll('.pricing-curr-symbol').forEach(el => {
      el.textContent = symbol;
    });
    document.querySelectorAll('.pricing-curr-symbol-badge').forEach(el => {
      el.textContent = symbol;
    });
  }

  function initModuleCurrency() {
    const btnSyncNow = document.getElementById('btn-sync-now');
    const toggleAutoSync = document.getElementById('toggle-auto-sync');
    const btnSaveManualRates = document.getElementById('btn-save-manual-rates');
    const btnSavePricingFormulas = document.getElementById('btn-save-pricing-formulas');
    const selectPricingBaseCurrency = document.getElementById('select-pricing-base-currency');

    const rateRub = document.getElementById('rate-rub');
    const ratePvc = document.getElementById('rate-pvc');
    const ratePu = document.getElementById('rate-pu');
    const rateGrp = document.getElementById('rate-grp');
    const rateB2bDiscount = document.getElementById('rate-b2b-discount');
    const rateVat = document.getElementById('rate-vat');
    const rateSpliceSp = document.getElementById('rate-splice-sp');

    const db = getDB();
    const formulas = db.pricing_formulas || DEFAULT_DB.pricing_formulas;
    if (rateRub) rateRub.value = formulas.belt_base_rates?.RUB || 4250;
    if (ratePvc) ratePvc.value = formulas.belt_base_rates?.PVC || 2600;
    if (ratePu) ratePu.value = formulas.belt_base_rates?.PU || 3800;
    if (rateGrp) rateGrp.value = formulas.belt_base_rates?.GRP || 3400;
    if (rateB2bDiscount) rateB2bDiscount.value = formulas.b2b_discount_percent ?? 15;
    if (rateVat) rateVat.value = formulas.vat_percent ?? 20;
    if (rateSpliceSp) rateSpliceSp.value = formulas.splice_costs?.SP || 1450;

    const baseCurr = formulas.base_currency || 'TRY';
    if (selectPricingBaseCurrency) {
      selectPricingBaseCurrency.value = baseCurr;
      updatePricingBadges(baseCurr);
      selectPricingBaseCurrency.addEventListener('change', () => {
        updatePricingBadges(selectPricingBaseCurrency.value);
      });
    }

    fetchAndRenderExchangeRates();

    setInterval(() => {
      fetchAndRenderExchangeRates();
    }, 15 * 60 * 1000);

    if (btnSyncNow) {
      btnSyncNow.addEventListener('click', async () => {
        btnSyncNow.disabled = true;
        btnSyncNow.classList.add('opacity-70');
        showToast('open.er-api.com üzerinden canlı USD ve EUR kurları çekiliyor...');
        await fetchAndRenderExchangeRates(true);
        btnSyncNow.disabled = false;
        btnSyncNow.classList.remove('opacity-70');
        showToast('Canlı kurlar başarıyla güncellendi!');
      });
    }

    if (toggleAutoSync) {
      toggleAutoSync.addEventListener('change', async () => {
        const liveDB = getDB();
        const isAuto = toggleAutoSync.checked;

        if (!liveDB.currencies) liveDB.currencies = { ...DEFAULT_DB.currencies };
        liveDB.currencies.auto_sync = isAuto;
        liveDB.currencies.api_source = isAuto ? 'open.er-api.com' : 'Manual';

        if (!liveDB.exchange_rate) liveDB.exchange_rate = {};
        liveDB.exchange_rate.auto_sync = isAuto;
        liveDB.exchange_rate.api_source = isAuto ? 'open.er-api.com' : 'Manual';

        localStorage.setItem('desan_rates', JSON.stringify({
          usd_try: liveDB.currencies.rates?.USD || 38.50,
          eur_try: liveDB.currencies.rates?.EUR || 42.20,
          last_updated: new Date().toISOString(),
          timestamp: Date.now(),
          auto_sync: isAuto,
          api_source: isAuto ? 'open.er-api.com' : 'Manual'
        }));

        saveDB(liveDB);

        if (isAuto) {
          showToast('15 dk otomatik open.er-api.com senkronizasyonu açıldı. Canlı kurlar çekiliyor...');
          await fetchAndRenderExchangeRates(true);
        } else {
          fetchAndRenderExchangeRates(false);
          showToast('Otomatik API senkronizasyonu kapatıldı (Manuel sabit mod).');
        }
      });
    }

    if (btnSaveManualRates) {
      btnSaveManualRates.addEventListener('click', () => {
        const usdVal = parseFloat(document.getElementById('input-manual-usd')?.value) || 38.50;
        const eurVal = parseFloat(document.getElementById('input-manual-eur')?.value) || 42.20;
        const nowIso = new Date().toISOString();

        const liveDB = getDB();
        if (!liveDB.currencies) liveDB.currencies = { ...DEFAULT_DB.currencies };
        liveDB.currencies.rates = {
          TRY: 1.0,
          USD: usdVal,
          EUR: eurVal
        };
        liveDB.currencies.auto_sync = false;
        liveDB.currencies.api_source = "Manual";
        liveDB.currencies.last_updated = nowIso;

        if (!liveDB.exchange_rate) liveDB.exchange_rate = {};
        liveDB.exchange_rate.usd_try = usdVal;
        liveDB.exchange_rate.eur_try = eurVal;
        liveDB.exchange_rate.last_updated = nowIso;
        liveDB.exchange_rate.auto_sync = false;
        liveDB.exchange_rate.api_source = "Manual";

        if (toggleAutoSync) toggleAutoSync.checked = false;

        localStorage.setItem('desan_rates', JSON.stringify({
          usd_try: usdVal,
          eur_try: eurVal,
          last_updated: nowIso,
          timestamp: Date.now(),
          auto_sync: false,
          api_source: 'Manual'
        }));

        saveDB(liveDB);
        fetchAndRenderExchangeRates(false);
        showToast(`Manuel kurlar sabitlendi ve kaydedildi! (USD: ${usdVal.toFixed(2)} ₺, EUR: ${eurVal.toFixed(2)} ₺)`);
      });
    }

    if (btnSavePricingFormulas) {
      btnSavePricingFormulas.addEventListener('click', () => {
        const liveDB = getDB();
        const chosenCurr = selectPricingBaseCurrency?.value || 'TRY';
        liveDB.pricing_formulas = {
          ...liveDB.pricing_formulas,
          base_currency: chosenCurr,
          belt_base_rates: {
            RUB: parseFloat(rateRub?.value) || 4250,
            PVC: parseFloat(ratePvc?.value) || 2600,
            PU: parseFloat(ratePu?.value) || 3800,
            GRP: parseFloat(rateGrp?.value) || 3400
          },
          splice_costs: {
            ...liveDB.pricing_formulas?.splice_costs,
            SP: parseFloat(rateSpliceSp?.value) || 1450
          },
          b2b_discount_percent: parseFloat(rateB2bDiscount?.value) ?? 15,
          vat_percent: parseFloat(rateVat?.value) ?? 20
        };
        saveDB(liveDB);
        updatePricingBadges(chosenCurr);
        showToast(`Fiyatlandırma parametreleri ve taban para birimi (${chosenCurr}) tüm sitede güncellendi!`);
      });
    }
  }

  // ==========================================
  // MODÜL 2: GELEN TEKLİF & PROFORMA MASASI (RFQ)
  // ==========================================
  let rfqCurrentFilter = 'all';
  const ITEMS_PER_PAGE = 8;
  let rfqCurrentPage = 1;

  function renderRfqTable() {
    const db = getDB();
    const quotes = db.quotes_archive || [];
    const tbody = document.getElementById('rfq-table-body');
    const badgeRfqCount = document.getElementById('badge-rfq-count');
    const searchVal = document.getElementById('rfq-search-input')?.value.toLowerCase().trim() || '';

    if (badgeRfqCount) badgeRfqCount.textContent = quotes.length;
    if (!tbody) return;

    let filtered = quotes;
    if (rfqCurrentFilter !== 'all') {
      filtered = filtered.filter(q => q.status === rfqCurrentFilter);
    }
    if (searchVal) {
      filtered = filtered.filter(q => (q.id && q.id.toLowerCase().includes(searchVal)) || (q.company && q.company.toLowerCase().includes(searchVal)) || (q.contact_person && q.contact_person.toLowerCase().includes(searchVal)));
    }

    const totalFiltered = filtered.length;
    const totalPages = Math.ceil(totalFiltered / ITEMS_PER_PAGE) || 1;

    if (rfqCurrentPage > totalPages) rfqCurrentPage = totalPages;
    if (rfqCurrentPage < 1) rfqCurrentPage = 1;

    if (totalFiltered === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="py-8 text-center text-slate-400 font-mono">Kayıtlı teklif bulunamadı.</td></tr>`;
      renderRfqPagination(0, 1);
      return;
    }

    const startIndex = (rfqCurrentPage - 1) * ITEMS_PER_PAGE;
    const paginatedItems = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    tbody.innerHTML = '';
    paginatedItems.forEach(q => {
      let badgeClass = 'bg-sky-50 text-sky-700 border-sky-200';
      if (q.status === 'İnceleniyor') badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
      else if (q.status === 'Onaylandı') badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      else if (q.status === 'İmalatta') badgeClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      else if (q.status === 'Sevk Edildi') badgeClass = 'bg-purple-50 text-purple-700 border-purple-200';

      const isGuest = q.is_guest !== false && !q.cari_id;
      const typeBadge = isGuest
        ? `<span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">Misafir</span>`
        : `<span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">Cari</span>`;

      const hasNotes = q.customer_notes && q.customer_notes.trim() !== '' && q.customer_notes !== 'Ek not iletilmedi.';
      const noteBadge = hasNotes
        ? `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300" title="${q.customer_notes}">📝 Not Var</span>`
        : '';

      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50 transition-colors cursor-pointer group';
      tr.setAttribute('data-id', q.id);
      tr.innerHTML = `
        <td class="py-3 px-3 font-mono font-bold text-[#0284C7] group-hover:underline">${q.id}</td>
        <td class="py-3 px-3 font-semibold text-slate-900">${q.company} ${typeBadge} ${noteBadge}</td>
        <td class="py-3 px-3 text-slate-600">${q.contact_person || 'Belirtilmedi'}</td>
        <td class="py-3 px-3 text-center font-mono font-bold text-slate-700">${q.items_count || (q.items ? q.items.length : 1)}</td>
        <td class="py-3 px-3 text-right font-mono font-bold text-slate-900">₺ ${(q.total_try || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td class="py-3 px-3 font-mono text-slate-500 text-[11px]">${q.date || '-'}</td>
        <td class="py-3 px-3">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${badgeClass}">${q.status}</span>
        </td>
        <td class="py-3 px-3 text-right">
          <div class="flex items-center gap-1.5 justify-end">
            <button class="btn-view-quote px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold transition-colors cursor-pointer" data-id="${q.id}">
              İncele
            </button>
            <button class="btn-delete-quote p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer" title="Teklifi Sil" data-id="${q.id}">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('tr[data-id]').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('.btn-delete-quote')) return;
        const id = row.getAttribute('data-id');
        openRfqModal(id);
      });
    });

    tbody.querySelectorAll('.btn-delete-quote').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        deleteRfqQuote(id);
      });
    });

    renderRfqPagination(totalFiltered, totalPages);
  }

  function renderRfqPagination(totalFiltered, totalPages) {
    const infoEl = document.getElementById('rfq-pagination-info');
    const controlsEl = document.getElementById('rfq-pagination-controls');
    if (!infoEl || !controlsEl) return;

    if (totalFiltered === 0) {
      infoEl.textContent = 'Kayıtlı teklif bulunamadı.';
      controlsEl.innerHTML = '';
      return;
    }

    const startItem = (rfqCurrentPage - 1) * ITEMS_PER_PAGE + 1;
    const endItem = Math.min(rfqCurrentPage * ITEMS_PER_PAGE, totalFiltered);

    infoEl.textContent = `Toplam ${totalFiltered} tekliften ${startItem} - ${endItem} arası gösteriliyor`;

    let buttonsHtml = '';

    const prevDisabled = rfqCurrentPage === 1;
    buttonsHtml += `
      <button class="rfq-page-btn px-2.5 py-1 rounded text-xs transition-colors ${prevDisabled ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400' : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 cursor-pointer'}" data-page="${rfqCurrentPage - 1}" ${prevDisabled ? 'disabled' : ''}>
        Önceki
      </button>
    `;

    for (let p = 1; p <= totalPages; p++) {
      const isActive = p === rfqCurrentPage;
      buttonsHtml += `
        <button class="rfq-page-btn px-2.5 py-1 rounded text-xs transition-colors ${isActive ? 'bg-[#0284C7] text-white font-bold shadow-2xs' : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 cursor-pointer'}" data-page="${p}">
          ${p}
        </button>
      `;
    }

    const nextDisabled = rfqCurrentPage === totalPages;
    buttonsHtml += `
      <button class="rfq-page-btn px-2.5 py-1 rounded text-xs transition-colors ${nextDisabled ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400' : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 cursor-pointer'}" data-page="${rfqCurrentPage + 1}" ${nextDisabled ? 'disabled' : ''}>
        Sonraki
      </button>
    `;

    controlsEl.innerHTML = buttonsHtml;

    controlsEl.querySelectorAll('.rfq-page-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        const pageNum = parseInt(btn.getAttribute('data-page'), 10);
        if (pageNum && pageNum !== rfqCurrentPage) {
          rfqCurrentPage = pageNum;
          renderRfqTable();
        }
      });
    });
  }

  function deleteRfqQuote(quoteId) {
    const ok = confirm(`${quoteId} numaralı teklif kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`);
    if (!ok) return;

    const liveDB = getDB();
    const index = (liveDB.quotes_archive || []).findIndex(item => item.id === quoteId || item.teklif_no === quoteId);
    if (index !== -1) {
      liveDB.quotes_archive.splice(index, 1);
      saveDB(liveDB);

      // Boundary Handling
      const searchVal = document.getElementById('rfq-search-input')?.value.toLowerCase().trim() || '';
      let filtered = liveDB.quotes_archive || [];
      if (rfqCurrentFilter !== 'all') {
        filtered = filtered.filter(q => q.status === rfqCurrentFilter);
      }
      if (searchVal) {
        filtered = filtered.filter(q => (q.id && q.id.toLowerCase().includes(searchVal)) || (q.company && q.company.toLowerCase().includes(searchVal)) || (q.contact_person && q.contact_person.toLowerCase().includes(searchVal)));
      }
      const newTotalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
      if (rfqCurrentPage > newTotalPages) {
        rfqCurrentPage = Math.max(1, newTotalPages);
      }

      renderRfqTable();
      showToast(`${quoteId} numaralı teklif başarıyla silindi.`, 'info');

      window.dispatchEvent(new Event('storage'));
    }
  }

  function openRfqModal(rfqId) {
    const db = getDB();
    const q = (db.quotes_archive || []).find(item => item.id === rfqId);
    if (!q) return;

    activeRfqIdInModal = rfqId;

    const backdrop = document.getElementById('rfq-modal-backdrop');
    const title = document.getElementById('modal-rfq-title');
    const subtitle = document.getElementById('modal-rfq-subtitle');
    const content = document.getElementById('modal-rfq-content');
    const statusSelect = document.getElementById('modal-status-select');

    if (title) title.textContent = `Teklif Detayı: ${q.id}`;
    if (subtitle) subtitle.textContent = `${q.company} | ${q.contact_person || ''}`;
    if (statusSelect) statusSelect.value = q.status;

    let itemsHtml = '';
    (q.items || []).forEach((item, idx) => {
      const rowTotal = (item.qty || 1) * (item.unitPrice || 0);
      itemsHtml += `
        <tr class="border-b border-slate-100">
          <td class="py-2 font-mono text-slate-400 text-xs">${idx + 1}</td>
          <td class="py-2">
            <div class="font-semibold text-slate-900">${item.title}</div>
            <div class="text-[11px] text-slate-500">${item.desc || ''}</div>
          </td>
          <td class="py-2 text-center font-mono font-bold text-slate-700">${item.qty} ${item.unit || 'ad'}</td>
          <td class="py-2 text-right font-mono text-slate-600">₺ ${(item.unitPrice || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
          <td class="py-2 text-right font-mono font-bold text-slate-900">₺ ${rowTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
        </tr>
      `;
    });

    const isGuest = q.is_guest !== false && !q.cari_id;
    const cariBadgeHtml = isGuest
      ? `<div class="mt-2 flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-mono">
          <span class="text-amber-800 font-bold flex items-center gap-1.5"><span class="material-symbols-outlined text-[16px]">info</span>Bu teklif Misafir Müşteri tarafından oluşturulmuştur.</span>
          <button id="btn-convert-guest-to-cari" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95">
            <span class="material-symbols-outlined text-[16px]">domain_add</span>
            <span>Cari Olarak Kaydet</span>
          </button>
         </div>`
      : `<div class="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-mono text-emerald-800 font-bold flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[16px] text-emerald-600">verified</span>
          <span>Doğrulanmış Kurumsal Cari Hesabı (%${q.discount_percent ?? 15} Özel İskonto)</span>
         </div>`;

    const customerNotesHtml = q.customer_notes
      ? `<div class="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900 mb-4">
           <span class="font-bold text-xs uppercase tracking-wider text-amber-700 block mb-1">Müşteri Notu:</span>
           <p class="text-xs font-mono">${q.customer_notes}</p>
         </div>`
      : '';

    content.innerHTML = `
      <div class="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-2 gap-3 text-xs">
        <div><strong class="text-slate-500">Vergi Dairesi / No:</strong> <span class="font-mono text-slate-800">${q.tax_office || 'Belirtilmedi'}</span></div>
        <div><strong class="text-slate-500">İletişim Tel:</strong> <span class="font-mono text-slate-800">${q.phone || 'Belirtilmedi'}</span></div>
        <div><strong class="text-slate-500">E-Posta:</strong> <span class="font-mono text-slate-800">${q.email || 'Belirtilmedi'}</span></div>
        <div><strong class="text-slate-500">Teklif Tarihi:</strong> <span class="font-mono text-slate-800">${q.date}</span></div>
      </div>

      ${cariBadgeHtml}

      ${customerNotesHtml}

      <div>
        <h4 class="font-bold text-xs uppercase text-slate-500 mb-2 font-mono">Talep Edilen İmalat Kalemleri</h4>
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="border-b border-slate-200 text-slate-400 font-mono uppercase text-[10px]">
              <th class="py-1.5">#</th>
              <th class="py-1.5">Ürün / Açıklama</th>
              <th class="py-1.5 text-center">Miktar</th>
              <th class="py-1.5 text-right">Birim Fiyat</th>
              <th class="py-1.5 text-right">Tutar</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
      </div>

      <div class="bg-sky-50/50 p-4 rounded-lg border border-sky-200 flex flex-col gap-2 font-mono text-xs">
        <div class="flex justify-between text-slate-600">
          <span>Ara Toplam:</span>
          <strong>₺ ${(q.subtotal || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</strong>
        </div>
        
        <div class="flex items-center justify-between">
          <span class="text-slate-600">Revize B2B İskonto Oranı (%):</span>
          <input type="number" id="modal-input-discount" class="w-20 px-2 py-1 bg-white border border-slate-300 rounded text-right font-bold" value="${q.discount_percent ?? 15}">
        </div>

        <div class="flex justify-between text-slate-600">
          <span>Net Tutar:</span>
          <strong id="modal-net-val">₺ ${((q.subtotal || 0) * (1 - (q.discount_percent ?? 15)/100)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</strong>
        </div>

        <div class="flex justify-between text-slate-600">
          <span>KDV (%${q.vat_percent ?? 20}):</span>
          <strong id="modal-vat-val">₺ ${(((q.subtotal || 0) * (1 - (q.discount_percent ?? 15)/100)) * ((q.vat_percent ?? 20)/100)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</strong>
        </div>

        <div class="flex justify-between text-slate-900 font-bold text-sm pt-2 border-t border-sky-200">
          <span>GENEL TOPLAM:</span>
          <span id="modal-total-val" class="text-[#0284C7]">₺ ${(q.total_try || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    `;

    backdrop.classList.remove('hidden');

    const btnConvert = document.getElementById('btn-convert-guest-to-cari');
    if (btnConvert) {
      btnConvert.addEventListener('click', () => {
        const inputDisc = prompt(`"${q.company}" firması için Özel B2B İskonto Oranını (%) giriniz:`, '18');
        if (inputDisc === null) return;
        const discountRate = parseFloat(inputDisc) || 15;

        const liveDB = getDB();
        const liveQuote = (liveDB.quotes_archive || []).find(item => item.id === rfqId);
        if (!liveQuote) return;

        const newCariId = 'cari_' + String(Date.now()).slice(-4);
        const taxOfficeVal = liveQuote.tax_office ? liveQuote.tax_office.split('/')[0].trim() : 'İkitelli V.D.';
        const taxIdVal = liveQuote.tax_office && liveQuote.tax_office.includes('/') ? liveQuote.tax_office.split('/')[1].trim() : '1234567890';

        const newCari = {
          id: newCariId,
          tax_id: taxIdVal,
          email: liveQuote.email || 'info@firma.com',
          company_name: liveQuote.company,
          tax_office: taxOfficeVal,
          address: liveQuote.address || 'İstanbul OSB',
          authorized_person: liveQuote.contact_person || 'Satınalma Yetkilisi',
          phone: liveQuote.phone || '+90 212 000 00 00',
          custom_discount_percent: discountRate
        };

        if (!liveDB.customer_accounts) liveDB.customer_accounts = [];
        liveDB.customer_accounts.push(newCari);

        liveQuote.is_guest = false;
        liveQuote.cari_id = newCariId;
        liveQuote.discount_percent = discountRate;
        const net = liveQuote.subtotal * (1 - discountRate / 100);
        const vat = net * ((liveQuote.vat_percent ?? 20) / 100);
        liveQuote.total_try = net + vat;

        saveDB(liveDB);
        renderRfqTable();
        renderCustomersTable();
        openRfqModal(rfqId);
        showToast(`"${liveQuote.company}" başarıyla Kurumsal Cari olarak kaydedildi (%${discountRate} iskonto).`);
      });
    }

    const discInput = document.getElementById('modal-input-discount');
    if (discInput) {
      discInput.addEventListener('input', () => {
        const discRate = (parseFloat(discInput.value) || 0) / 100;
        const sub = q.subtotal || 0;
        const net = sub * (1 - discRate);
        const vat = net * ((q.vat_percent ?? 20) / 100);
        const tot = net + vat;

        document.getElementById('modal-net-val').textContent = `₺ ${net.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
        document.getElementById('modal-vat-val').textContent = `₺ ${vat.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
        document.getElementById('modal-total-val').textContent = `₺ ${tot.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
      });
    }
  }

  function initModuleRfq() {
    const searchInput = document.getElementById('rfq-search-input');
    const filterBtns = document.querySelectorAll('.rfq-filter-btn');
    const btnCloseModal = document.getElementById('btn-close-rfq-modal');
    const backdrop = document.getElementById('rfq-modal-backdrop');
    const btnModalSave = document.getElementById('btn-modal-save-rfq');
    const btnModalWa = document.getElementById('btn-modal-wa-send');

    renderRfqTable();

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        rfqCurrentPage = 1;
        renderRfqTable();
      });
    }

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.className = 'rfq-filter-btn px-3 py-1 rounded-full text-xs font-mono font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200');
        btn.className = 'rfq-filter-btn px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#0284C7] text-white';
        rfqCurrentFilter = btn.getAttribute('data-status');
        rfqCurrentPage = 1;
        renderRfqTable();
      });
    });

    if (btnCloseModal && backdrop) {
      btnCloseModal.addEventListener('click', () => backdrop.classList.add('hidden'));
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) backdrop.classList.add('hidden');
      });
    }

    if (btnModalSave) {
      btnModalSave.addEventListener('click', () => {
        if (!activeRfqIdInModal) return;
        const db = getDB();
        const quote = (db.quotes_archive || []).find(item => item.id === activeRfqIdInModal);
        if (quote) {
          const statusSelect = document.getElementById('modal-status-select');
          const discInput = document.getElementById('modal-input-discount');

          if (statusSelect) quote.status = statusSelect.value;
          if (discInput) {
            const newDisc = parseFloat(discInput.value) || 0;
            quote.discount_percent = newDisc;
            const net = quote.subtotal * (1 - newDisc / 100);
            const vat = net * ((quote.vat_percent ?? 20) / 100);
            quote.total_try = net + vat;
          }
          saveDB(db);
          renderRfqTable();
          backdrop.classList.add('hidden');
          showToast(`${activeRfqIdInModal} teklif detayları ve durumu güncellendi.`);
        }
      });
    }

    if (btnModalWa) {
      btnModalWa.addEventListener('click', () => {
        if (!activeRfqIdInModal) return;
        const db = getDB();
        const q = (db.quotes_archive || []).find(item => item.id === activeRfqIdInModal);
        if (!q) return;

        let msg = `*DESAN KONVEYÖR - REVİZE PROFORMA TEKLİFİ*\n`;
        msg += `Teklif No: *${q.id}*\n`;
        msg += `Firma: *${q.company}*\n`;
        msg += `Revize İskonto: %${q.discount_percent}\n`;
        msg += `Genel Toplam: *₺ ${(q.total_try || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}*\n`;
        msg += `Durum: ${q.status}\n`;
        window.open(`https://wa.me/905327075281?text=${encodeURIComponent(msg)}`, '_blank');
      });
    }
  }

  // ==========================================
  // MODÜL 3: STANDART ÜRÜN & STOK YÖNETİMİ
  // ==========================================
  function renderStockTable() {
    const db = getDB();
    const products = db.products_stock || [];
    const tbody = document.getElementById('stock-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    products.forEach(p => {
      const isInStock = p.stock_status === 'in_stock';
      const badgeClass = isInStock ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200';
      const badgeText = isInStock ? 'Stokta Var' : 'Sipariş Üzerine';

      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50 transition-colors';
      tr.innerHTML = `
        <td class="py-3 px-3 font-mono text-slate-500 font-bold">${p.id}</td>
        <td class="py-3 px-3 font-semibold text-slate-900">${p.name}</td>
        <td class="py-3 px-3 text-slate-600">${p.category}</td>
        <td class="py-3 px-3">
          <button class="toggle-stock-btn inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border ${badgeClass}" data-id="${p.id}">
            ${badgeText}
          </button>
        </td>
        <td class="py-3 px-3 text-right">
          <input type="number" class="price-unit-input w-24 px-2 py-1 bg-white border border-slate-300 rounded text-right font-mono font-bold text-xs" data-id="${p.id}" value="${p.unit_price}">
        </td>
        <td class="py-3 px-3 text-right">
          <input type="number" class="price-bulk-input w-24 px-2 py-1 bg-white border border-slate-300 rounded text-right font-mono font-bold text-xs text-slate-600" data-id="${p.id}" value="${p.bulk_price_10}">
        </td>
        <td class="py-3 px-3 text-right">
          <button class="save-prod-btn px-2.5 py-1 bg-slate-900 hover:bg-[#0284C7] text-white rounded text-[11px] font-semibold transition-all" data-id="${p.id}">Kaydet</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.toggle-stock-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const liveDB = getDB();
        const prod = liveDB.products_stock.find(item => item.id === id);
        if (prod) {
          prod.stock_status = prod.stock_status === 'in_stock' ? 'on_order' : 'in_stock';
          saveDB(liveDB);
          renderStockTable();
          showToast(`${prod.name} stok durumu güncellendi.`);
        }
      });
    });

    tbody.querySelectorAll('.save-prod-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const liveDB = getDB();
        const prod = liveDB.products_stock.find(item => item.id === id);
        if (prod) {
          const unitInput = tbody.querySelector(`.price-unit-input[data-id="${id}"]`);
          const bulkInput = tbody.querySelector(`.price-bulk-input[data-id="${id}"]`);
          if (unitInput) prod.unit_price = parseFloat(unitInput.value) || prod.unit_price;
          if (bulkInput) prod.bulk_price_10 = parseFloat(bulkInput.value) || prod.bulk_price_10;
          saveDB(liveDB);
          showToast(`${prod.name} fiyatları güncellendi.`);
        }
      });
    });
  }

  function initModuleStock() {
    renderStockTable();
    const btnAddProd = document.getElementById('btn-add-product');
    if (btnAddProd) {
      btnAddProd.addEventListener('click', () => {
        const name = prompt('Yeni Ürün Adını Giriniz:');
        if (!name) return;
        const category = prompt('Kategori (örn: Yataklı Rulman, Sıyırıcı):', 'Standart Parça') || 'Standart Parça';
        const price = parseFloat(prompt('Birim Fiyat (₺):', '1500')) || 1500;

        const liveDB = getDB();
        const newId = 'P-' + String(liveDB.products_stock.length + 101);
        liveDB.products_stock.push({
          id: newId,
          name: name,
          category: category,
          stock_status: 'in_stock',
          unit_price: price,
          bulk_price_10: Math.round(price * 0.85)
        });
        saveDB(liveDB);
        renderStockTable();
        showToast(`${name} başarıyla stok listesine eklendi.`);
      });
    }
  }

  // ==========================================
  // MODÜL 4: SAHA SERVİS VE KEŞİF RANDEVULARI
  // ==========================================
  function renderServiceTable() {
    const db = getDB();
    const list = db.service_appointments || [];
    const tbody = document.getElementById('service-table-body');
    if (!tbody) return;

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-slate-400 font-mono">Kayıtlı servis randevusu bulunamadı.</td></tr>`;
      return;
    }

    tbody.innerHTML = '';
    list.forEach(s => {
      let badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
      if (s.status === 'Saha Ekibi Atandı') badgeClass = 'bg-sky-50 text-sky-700 border-sky-200';
      else if (s.status === 'Tamamlandı') badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';

      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50 transition-colors';
      tr.innerHTML = `
        <td class="py-3 px-3 font-mono font-bold text-slate-600">${s.id}</td>
        <td class="py-3 px-3 font-semibold text-slate-900">${s.company}</td>
        <td class="py-3 px-3 text-slate-600">${s.district}</td>
        <td class="py-3 px-3 text-slate-800 font-medium">${s.service_type}</td>
        <td class="py-3 px-3 font-mono text-slate-600 text-[11px]">${s.target_date}</td>
        <td class="py-3 px-3">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${badgeClass}">${s.status}</span>
        </td>
        <td class="py-3 px-3 text-right">
          <select class="service-status-select px-2 py-1 bg-white border border-slate-300 rounded text-xs font-semibold font-mono" data-id="${s.id}">
            <option value="İncelemede" ${s.status === 'İncelemede' ? 'selected' : ''}>İncelemede</option>
            <option value="Saha Ekibi Atandı" ${s.status === 'Saha Ekibi Atandı' ? 'selected' : ''}>Saha Ekibi Atandı</option>
            <option value="Tamamlandı" ${s.status === 'Tamamlandı' ? 'selected' : ''}>Tamamlandı</option>
          </select>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.service-status-select').forEach(sel => {
      sel.addEventListener('change', () => {
        const id = sel.getAttribute('data-id');
        const liveDB = getDB();
        const s = liveDB.service_appointments.find(item => item.id === id);
        if (s) {
          s.status = sel.value;
          saveDB(liveDB);
          renderServiceTable();
          showToast(`${id} randevu durumu "${sel.value}" olarak güncellendi.`);
        }
      });
    });
  }

  function initModuleService() {
    renderServiceTable();
  }

  // ==========================================
  // MODÜL 5: KURUMSAL CARİLER & MÜŞTERİ LİSTESİ
  // ==========================================
  function renderCustomersTable() {
    const db = getDB();
    const clients = db.customer_accounts || [];
    const tbody = document.getElementById('customers-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    clients.forEach(c => {
      const taxOffice = c.tax_office || 'V.D.';
      const taxNo = c.tax_id || c.tax_no || '-';
      const contact = c.authorized_person || c.contact || 'Yetkili';
      const phone = c.phone || '-';
      const email = c.email || '-';
      const discount = c.custom_discount_percent ?? c.discount_percent ?? 15;

      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50 transition-colors';
      tr.innerHTML = `
        <td class="py-3 px-3 font-mono font-bold text-slate-600">${c.id}</td>
        <td class="py-3 px-3 font-semibold text-slate-900 font-sans">
          <div>${c.company_name}</div>
          <div class="text-[11px] text-slate-500 font-mono">${email}</div>
        </td>
        <td class="py-3 px-3 text-slate-600 font-mono text-[11px]">${taxOffice} / ${taxNo}</td>
        <td class="py-3 px-3 text-slate-800 text-xs">
          <div>${contact}</div>
          <div class="text-[11px] text-slate-500 font-mono">${phone}</div>
        </td>
        <td class="py-3 px-3 text-center">
          <input type="number" class="cust-discount-input w-16 px-2 py-1 bg-white border border-slate-300 rounded text-center font-mono font-bold text-xs text-[#0284C7]" data-id="${c.id}" value="${discount}">
        </td>
        <td class="py-3 px-3 text-right">
          <button class="save-cust-btn px-2.5 py-1 bg-slate-900 hover:bg-[#0284C7] text-white rounded text-[11px] font-semibold transition-all cursor-pointer active:scale-95" data-id="${c.id}">Kaydet</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.save-cust-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const liveDB = getDB();
        const client = liveDB.customer_accounts.find(item => item.id === id);
        if (client) {
          const discInput = tbody.querySelector(`.cust-discount-input[data-id="${id}"]`);
          if (discInput) {
            const newDisc = parseFloat(discInput.value) || 0;
            client.custom_discount_percent = newDisc;
            client.discount_percent = newDisc;
          }
          saveDB(liveDB);
          showToast(`${client.company_name} özel iskontosu %${client.custom_discount_percent} olarak güncellendi.`);
        }
      });
    });
  }

  function initModuleCustomers() {
    renderCustomersTable();
    const btnAddCust = document.getElementById('btn-add-customer');
    if (btnAddCust) {
      btnAddCust.addEventListener('click', () => {
        const name = prompt('Firma Unvanını Giriniz:');
        if (!name) return;
        const taxId = prompt('Vergi No / TCKN:', '1234567890') || '1234567890';
        const email = prompt('Kurumsal E-Posta:', 'info@firma.com') || 'info@firma.com';
        const contact = prompt('Yetkili Adı & Unvanı:', 'Ahmet Yılmaz (Satınalma Md.)') || 'Satınalma Md.';
        const phone = prompt('Telefon Numarası:', '+90 212 000 00 00') || '+90 212 000 00 00';
        const discount = parseFloat(prompt('Özel B2B İskonto Oranı (%):', '15')) || 15;

        const liveDB = getDB();
        const newId = 'cari_' + String(liveDB.customer_accounts.length + 1).padStart(3, '0');
        liveDB.customer_accounts.push({
          id: newId,
          tax_id: taxId,
          email: email,
          company_name: name,
          tax_office: 'İkitelli V.D.',
          address: 'İstanbul OSB',
          authorized_person: contact,
          contact: contact,
          phone: phone,
          custom_discount_percent: discount,
          discount_percent: discount
        });
        saveDB(liveDB);
        renderCustomersTable();
        showToast(`${name} kurumsal cari hesabı başarıyla eklendi.`);
      });
    }
  }

  // ==========================================
  // MODÜL 6: GENEL SİTE & YÖNETİCİ ŞİFRE AYARLARI
  // ==========================================
  function initModuleSettings() {
    const db = getDB();
    const s = db.site_settings || DEFAULT_DB.site_settings;
    const creds = db.admin_credentials || DEFAULT_DB.admin_credentials;

    const inputBadges = document.getElementById('setting-trust-badges');
    const inputHours = document.getElementById('setting-working-hours');
    const inputGsm = document.getElementById('setting-[#0284C7]');
    const inputWa = document.getElementById('setting-wa');
    const btnSaveSettings = document.getElementById('btn-save-site-settings');

    const adminUser = document.getElementById('setting-admin-user');
    const adminCurrentPass = document.getElementById('setting-admin-current-pass');
    const adminNewPass = document.getElementById('setting-admin-new-pass');
    const adminConfirmPass = document.getElementById('setting-admin-confirm-pass');
    const formUpdateCreds = document.getElementById('admin-update-credentials-form');

    if (inputBadges && s.trust_badges_text) inputBadges.value = s.trust_badges_text;
    if (inputHours && s.working_hours) inputHours.value = s.working_hours;
    if (inputGsm && s.phone_gsm) inputGsm.value = s.phone_gsm;
    if (inputWa && s.whatsapp_no) inputWa.value = s.whatsapp_no;

    if (adminUser) adminUser.value = creds.username || 'desan';

    if (formUpdateCreds) {
      formUpdateCreds.addEventListener('submit', (e) => {
        e.preventDefault();
        const liveDB = getDB();
        const currentCreds = liveDB.admin_credentials || DEFAULT_DB.admin_credentials;

        const typedCurrentPass = adminCurrentPass?.value || '';
        const typedNewUser = adminUser?.value.trim() || 'desan';
        const typedNewPass = adminNewPass?.value || '';
        const typedConfirmPass = adminConfirmPass?.value || '';

        if (typedCurrentPass !== currentCreds.password) {
          showToast('Mevcut şifre hatalı! Lütfen kontrol ediniz.', 'error');
          return;
        }

        if (typedNewPass.length < 4) {
          showToast('Yeni şifre en az 4 karakter olmalıdır.', 'error');
          return;
        }

        if (typedNewPass !== typedConfirmPass) {
          showToast('Yeni şifreler birbiriyle uyuşmuyor!', 'error');
          return;
        }

        liveDB.admin_credentials = {
          username: typedNewUser,
          password: typedNewPass
        };
        saveDB(liveDB);

        localStorage.setItem('desan_admin_auth', typedNewUser);
        sessionStorage.setItem('desan_admin_session', typedNewUser);
        const loggedAdminName = document.getElementById('logged-admin-name');
        if (loggedAdminName) loggedAdminName.textContent = typedNewUser;

        if (adminCurrentPass) adminCurrentPass.value = '';
        if (adminNewPass) adminNewPass.value = '';
        if (adminConfirmPass) adminConfirmPass.value = '';

        showToast(`Giriş bilgileriniz güncellendi! Yeni Kullanıcı Adı: "${typedNewUser}"`, 'success');
      });
    }

    if (btnSaveSettings) {
      btnSaveSettings.addEventListener('click', () => {
        const liveDB = getDB();
        liveDB.site_settings = {
          trust_badges_text: inputBadges?.value || '',
          working_hours: inputHours?.value || '',
          phone_gsm: inputGsm?.value || '',
          whatsapp_no: inputWa?.value || ''
        };
        saveDB(liveDB);
        showToast('Genel site ayarları başarıyla güncellendi!');
      });
    }
  }

  // CROSS-TAB REACTIVITY LISTENER
  function initMasterSyncListener() {
    window.addEventListener('desan:master_sync', () => {
      fetchAndRenderExchangeRates();
      renderRfqTable();
      renderStockTable();
      renderServiceTable();
      renderCustomersTable();
    });
    window.addEventListener('storage', (e) => {
      if (e.key === MASTER_KEY || e.key === 'desan_db' || e.key === 'desan_rates') {
        fetchAndRenderExchangeRates();
        renderRfqTable();
        renderStockTable();
        renderServiceTable();
        renderCustomersTable();
      }
    });
  }

  // INITIALIZATION ON DOM READY
  document.addEventListener('DOMContentLoaded', () => {
    initAdminAuth();
    initSidebarTabs();
    initModuleCurrency();
    initModuleRfq();
    initModuleStock();
    initModuleService();
    initModuleCustomers();
    initModuleSettings();
    initMasterSyncListener();
  });

})();
