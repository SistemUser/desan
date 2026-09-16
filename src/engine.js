/**
 * Desan Konveyör & Mekanik İmalat
 * Core Functional Engine (Vanilla JS)
 * Handles: SPA Routing, Belt Configurator, Roller Tolerance Engine, Cart Math, Proforma, CollectAPI Live USD & EUR Currency Engine & Master Data Bridge
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

  // ==========================================
  // HYBRID B2B CARI AUTHENTICATION ENGINE
  // ==========================================
  const ACTIVE_CARI_KEY = 'desan_active_cari';

  function getActiveCari() {
    try {
      const saved = localStorage.getItem(ACTIVE_CARI_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('active cari read error:', e);
    }
    return null;
  }

  function setActiveCari(cari) {
    try {
      if (cari) {
        localStorage.setItem(ACTIVE_CARI_KEY, JSON.stringify(cari));
      } else {
        localStorage.removeItem(ACTIVE_CARI_KEY);
      }
    } catch (e) {
      console.warn('active cari save error:', e);
    }
    updateCariUI();
  }

  function clearActiveCari() {
    setActiveCari(null);
  }

  function updateCariUI() {
    const activeCari = getActiveCari();
    const btnOpenModal = document.getElementById('btn-open-cari-modal') || document.getElementById('link-cari-login');
    const badge = document.getElementById('topbar-cari-badge');
    const label = document.getElementById('topbar-cari-label');

    const compName = document.getElementById('company-name');
    const taxNum = document.getElementById('tax-number');
    const addr = document.getElementById('address');
    const contact = document.getElementById('contact-person');
    const compEmail = document.getElementById('company-email');
    const compBadge = document.getElementById('company-verified-badge');
    const compBadgeText = document.getElementById('company-verified-text');

    if (activeCari) {
      if (btnOpenModal) btnOpenModal.classList.add('hidden');
      if (badge) {
        badge.classList.remove('hidden');
        badge.classList.add('flex');
      }
      if (label) label.textContent = `${activeCari.company_name} (%${activeCari.custom_discount_percent} İskonto)`;

      if (compName) compName.value = activeCari.company_name || '';
      if (taxNum) taxNum.value = `${activeCari.tax_office ? activeCari.tax_office + ' / ' : ''}${activeCari.tax_id || ''}`;
      if (addr) addr.value = activeCari.address || '';
      if (contact) contact.value = activeCari.authorized_person || '';
      if (compEmail) compEmail.value = activeCari.email || '';

      if (compBadge) {
        compBadge.classList.remove('hidden');
        compBadge.classList.add('flex');
      }
      if (compBadgeText) {
        compBadgeText.textContent = `Doğrulanmış Kurumsal Cari (%${activeCari.custom_discount_percent} İskonto)`;
      }
    } else {
      if (btnOpenModal) btnOpenModal.classList.remove('hidden');
      if (badge) {
        badge.classList.add('hidden');
        badge.classList.remove('flex');
      }
      if (compBadge) {
        compBadge.classList.add('hidden');
        compBadge.classList.remove('flex');
      }
    }

    if (typeof renderCart === 'function') {
      renderCart();
    }
  }

  function initCariAuthModal() {
    const modal = document.getElementById('modal-cari-login');
    const inputLogin = document.getElementById('cari-login-input');
    const formLogin = document.getElementById('form-cari-login');

    const openModal = () => {
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        modal.style.display = 'flex';
      }
      if (inputLogin) {
        inputLogin.value = '';
        inputLogin.focus();
      }
    };

    const closeModal = () => {
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        modal.style.display = 'none';
      }
    };

    document.addEventListener('click', (e) => {
      const openTrigger = e.target.closest('#btn-open-cari-modal, #link-cari-login');
      if (openTrigger) {
        e.preventDefault();
        openModal();
        return;
      }

      const closeTrigger = e.target.closest('#btn-cari-login-close-x, #btn-cari-login-close');
      if (closeTrigger) {
        e.preventDefault();
        closeModal();
        return;
      }

      const switchReg = e.target.closest('#link-switch-to-register, #btn-open-register-inline');
      if (switchReg) {
        e.preventDefault();
        switchTab('register');
        return;
      }

      const switchLogin = e.target.closest('#link-switch-to-login');
      if (switchLogin) {
        e.preventDefault();
        switchTab('login');
        return;
      }

      const logoutTrigger = e.target.closest('#btn-topbar-logout');
      if (logoutTrigger) {
        e.preventDefault();
        clearActiveCari();
        showToast('Kurumsal cari oturumu kapatıldı. Misafir moduna geçildi.', 'info');
        return;
      }

      if (e.target === modal) {
        closeModal();
      }
    });

    const tabBtnLogin = document.getElementById('tab-btn-cari-login');
    const tabBtnRegister = document.getElementById('tab-btn-cari-register');
    const formRegister = document.getElementById('form-cari-register');
    const btnInlineRegister = document.getElementById('btn-open-register-inline');
    const footerText = document.getElementById('modal-cari-footer-text');

    const switchTab = (mode) => {
      if (mode === 'register') {
        if (formLogin) formLogin.classList.add('hidden');
        if (formRegister) formRegister.classList.remove('hidden');
        if (tabBtnLogin) {
          tabBtnLogin.className = 'flex-1 py-1.5 rounded-l-lg font-medium transition-all text-slate-600 hover:text-slate-900 cursor-pointer';
        }
        if (tabBtnRegister) {
          tabBtnRegister.className = 'flex-1 py-1.5 rounded-r-lg font-bold transition-all bg-white text-[#059669] shadow-2xs cursor-pointer analog-signal-tab active';
        }
        if (footerText) {
          footerText.innerHTML = `Zaten kurumsal kaydınız var mı? <a href="javascript:void(0)" id="link-switch-to-login" class="text-[#0284c7] font-semibold underline">Giriş Yapın</a>`;
        }
      } else {
        if (formRegister) formRegister.classList.add('hidden');
        if (formLogin) formLogin.classList.remove('hidden');
        if (tabBtnRegister) {
          tabBtnRegister.className = 'flex-1 py-1.5 rounded-r-lg font-semibold transition-all bg-slate-50/80 text-slate-700 hover:text-[#25D366] cursor-pointer analog-signal-tab';
        }
        if (tabBtnLogin) {
          tabBtnLogin.className = 'flex-1 py-1.5 rounded-l-lg font-bold transition-all bg-white text-[#0284c7] shadow-2xs cursor-pointer';
        }
        if (footerText) {
          footerText.innerHTML = `Sistemde kaydınız yok mu? <a href="javascript:void(0)" id="link-switch-to-register" class="text-[#0284c7] font-semibold underline">Hızlı Kayıt Formunu Doldurun</a>`;
        }
      }
    };

    if (tabBtnLogin) tabBtnLogin.addEventListener('click', () => switchTab('login'));
    if (tabBtnRegister) tabBtnRegister.addEventListener('click', () => switchTab('register'));

    if (formLogin) {
      formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = (inputLogin ? inputLogin.value : '').trim().toLowerCase();
        if (!query) return;

        const db = getDB();
        const customerAccounts = db.customer_accounts || [];

        const matchedCari = customerAccounts.find(c => {
          const matchTax = c.tax_id && c.tax_id.toLowerCase().trim() === query;
          const matchEmail = c.email && c.email.toLowerCase().trim() === query;
          return matchTax || matchEmail;
        });

        if (matchedCari) {
          setActiveCari(matchedCari);
          closeModal();
          showToast(`Hoş geldiniz, ${matchedCari.company_name}. %${matchedCari.custom_discount_percent} özel iskontonuz tanımlandı.`, 'success');
        } else {
          alert('Bu VKN veya E-Posta ile kayıtlı kurumsal cari bulunamadı. Misafir olarak devam edebilir veya yeni kayıt oluşturabilirsiniz.');
        }
      });
    }

    if (formRegister) {
      formRegister.addEventListener('submit', (e) => {
        e.preventDefault();
        const compName = document.getElementById('reg-company-name')?.value.trim();
        const taxId = document.getElementById('reg-tax-id')?.value.trim();
        const email = document.getElementById('reg-email')?.value.trim();
        const authorized = document.getElementById('reg-authorized')?.value.trim();
        const phone = document.getElementById('reg-phone')?.value.trim();
        const city = document.getElementById('reg-city')?.value.trim();
        const address = document.getElementById('reg-address')?.value.trim();

        if (!compName || !taxId || !email) return;

        const db = getDB();
        if (!db.customer_accounts) db.customer_accounts = [];

        const newId = 'cari_' + String(Date.now()).slice(-4);
        const taxOfficeVal = taxId.includes('/') ? taxId.split('/')[0].trim() : 'İkitelli V.D.';
        const taxNoVal = taxId.includes('/') ? taxId.split('/')[1].trim() : taxId;
        const fullAddress = address + (city ? ' ' + city : '');

        const newCari = {
          id: newId,
          tax_id: taxNoVal,
          email: email,
          company_name: compName,
          tax_office: taxOfficeVal,
          address: fullAddress,
          authorized_person: authorized,
          phone: phone,
          custom_discount_percent: 15
        };

        db.customer_accounts.push(newCari);
        saveDB(db);

        setActiveCari(newCari);
        closeModal();
        showToast(`Tebrikler ${compName}! B2B Kurumsal Cari kaydınız oluşturuldu.`, 'success');
        window.location.hash = 'sepet';
      });
    }

    updateCariUI();
  }

  const DEFAULT_CART = [
    {
      id: 'c1',
      title: 'EP 400/3 4+2 Antistatik Kauçuk Bant',
      desc: 'Genişlik: 800mm, Kalınlık: 10mm, Aşınma Dayanımlı',
      qty: 150,
      unit: 'm',
      unitPrice: 1240,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJhwVnmEkAv7dIdgZxkefDEhnA7l_wQqq01Tv9xIZIQ2fz_SLfah6mJpUXWrY4D_qiK3UEUcsB4NOZZcTdaJTklC69pPLMP-tvd_dDnEMwwKtPcyyBWeQRyYdwfF4fNum5jAdYaO-tTtit7COu_xxZ8gT_rurWZhfREPg658iwLK5XoIyTiGeLny-Yk0pvyNMbJ2ifhj5x8H7_I8l3-uTUBo8Aa-7-bzAwnE_HaAbrmZxZ8pPpbUbT'
    },
    {
      id: 'c2',
      title: 'Taşıyıcı Rulo İstasyonu – Üçlü',
      desc: 'Çap: Ø89mm, Boru: 315mm, Şase Genişliği: 800mm',
      qty: 45,
      unit: 'ad',
      unitPrice: 850,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBDXU98gVd288k6wB9YuZoN3Le3og3wl6oNnuHmH_8WLxRvmNK9Oh38GcNcnXjsEiEGx7jFSrFVnHSsYE9qyuuY2YDYYWZeKcESfG5tUsm87nVeMqr_VYTNH19UEFJB5VmASI_9pLJxdWdLfrAnJjyaO95ZwPPHidli-UhWrx4XAHqCdqOzm5jSPcxz_cRMygoCpy0tZissaGqOFT9c7Nnvj2nNM7yFpZ1YChw9IQ7pBimJYDgGM_3g'
    },
    {
      id: 'c3',
      title: 'UCP 210 Yataklı Rulman',
      desc: 'Mil Çapı: 50mm, Pik Döküm Gövde, Ağır Hizmet',
      qty: 12,
      unit: 'ad',
      unitPrice: 1120,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_Ktx4OFsRmW-hNuz3khP8M5BfXI_tPKqs3V4uA4KJteGJ0LY4CFPh8SwSse8-slw5qgG-2GJVKWIVANMgvUvYv0VnjQ5DmXnJDFlwnOIRjVS9OaytYxsACV12yNyHOQ0kwkQD0TJvpvCFHF1SzFk6lN7FyCksZyQQZLlhMDfdO2I7r-j7nhlU1FJ61jIZ33Erz_jwyui8FzjHAxulJC2J5-UDX5Kw4tMm3lxYpF4S4jNFQRupoVcv'
    }
  ];

  const STORAGE_KEY = 'desan_b2b_cart_v1';

  function loadCartFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('LocalStorage cart error:', e);
    }
    return DEFAULT_CART;
  }

  function saveCartToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cart));
    } catch (e) {
      console.warn('LocalStorage cart save error:', e);
    }
  }

  function getLiveRates() {
    const db = getDB();
    let cache = null;
    try {
      const saved = localStorage.getItem('desan_rates');
      if (saved) cache = JSON.parse(saved);
    } catch (e) {}

    const rates = db.currencies?.rates || {};
    const legacy = db.exchange_rate || {};
    const usd = rates.USD || legacy.usd_try || cache?.usd_try || 38.50;
    const eur = rates.EUR || legacy.eur_try || cache?.eur_try || 42.20;
    return { usd, eur };
  }

  const initialRates = getLiveRates();
  const state = {
    currency: 'TL', // 'TL', 'USD' or 'EUR'
    usdRate: initialRates.usd,
    eurRate: initialRates.eur,
    cart: loadCartFromStorage()
  };

  async function fetchLiveExchangeRate(force = false) {
    const db = getDB();
    const currencies = db.currencies || DEFAULT_DB.currencies;

    let cache = null;
    try {
      const savedRates = localStorage.getItem('desan_rates');
      if (savedRates) cache = JSON.parse(savedRates);
    } catch (e) {}

    const isAutoSync = force || (currencies.auto_sync !== false && db.exchange_rate?.auto_sync !== false && (cache ? cache.auto_sync !== false : true));

    if (!isAutoSync) {
      const rates = getLiveRates();
      state.usdRate = cache ? (cache.usd_try || rates.usd) : rates.usd;
      state.eurRate = cache ? (cache.eur_try || rates.eur) : rates.eur;
      return { usd: state.usdRate, eur: state.eurRate };
    }

    const now = Date.now();
    const fifteenMinMs = 15 * 60 * 1000;

    if (!force && cache && cache.timestamp && (now - cache.timestamp < fifteenMinMs)) {
      state.usdRate = cache.usd_try || currencies.rates?.USD || 38.50;
      state.eurRate = cache.eur_try || currencies.rates?.EUR || 42.20;
      return { usd: state.usdRate, eur: state.eurRate };
    }

    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-cache' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.rates && data.rates.TRY) {
          const liveUsd = parseFloat(data.rates.TRY);
          const eurUsdRate = data.rates.EUR ? parseFloat(data.rates.EUR) : 0.915;
          const liveEur = liveUsd / eurUsdRate;

          state.usdRate = liveUsd;
          state.eurRate = liveEur;

          const nowIso = new Date().toISOString();
          const targetAutoSync = force ? true : isAutoSync;

          const newCache = {
            usd_try: liveUsd,
            eur_try: liveEur,
            last_updated: nowIso,
            timestamp: now,
            auto_sync: targetAutoSync,
            api_source: targetAutoSync ? 'open.er-api.com' : 'Manual'
          };
          localStorage.setItem('desan_rates', JSON.stringify(newCache));

          db.currencies = {
            ...currencies,
            rates: { TRY: 1.0, USD: liveUsd, EUR: liveEur },
            last_updated: nowIso,
            auto_sync: targetAutoSync,
            api_source: targetAutoSync ? 'open.er-api.com' : 'Manual'
          };
          db.exchange_rate = {
            usd_try: liveUsd,
            eur_try: liveEur,
            last_updated: nowIso,
            auto_sync: targetAutoSync,
            api_source: targetAutoSync ? 'open.er-api.com' : 'Manual'
          };
          saveDB(db, true);

          return { usd: liveUsd, eur: liveEur };
        }
      }
    } catch (err) {
      console.warn('open.er-api.com Canlı kur çekilemedi (Fallback kullanılıyor):', err);
    }

    const rates = getLiveRates();
    state.usdRate = rates.usd;
    state.eurRate = rates.eur;
    return rates;
  }

  function initCurrencyEngine() {
    fetchLiveExchangeRate();
    setInterval(() => {
      fetchLiveExchangeRate();
    }, 15 * 60 * 1000);
  }

  function updateStateRates() {
    const rates = getLiveRates();
    state.usdRate = rates.usd;
    state.eurRate = rates.eur;
  }

  function convertBaseToTL(amount, baseCurrency = 'TRY') {
    const rates = getLiveRates();
    if (baseCurrency === 'USD') {
      return amount * (rates.usd || 38.50);
    } else if (baseCurrency === 'EUR') {
      return amount * (rates.eur || 42.20);
    }
    return amount;
  }

  // Utility: Currency Formatter (TL, USD & EUR Supported)
  function formatMoney(amount, showSymbol = true) {
    updateStateRates();

    let val = amount;
    let symbol = '₺';
    if (state.currency === 'USD') {
      val = amount / state.usdRate;
      symbol = '$';
    } else if (state.currency === 'EUR') {
      val = amount / state.eurRate;
      symbol = '€';
    }
    const formatted = val.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return showSymbol ? `${symbol} ${formatted}` : formatted;
  }

  // Toast Notification
  function showToast(message, type = 'success') {
    let container = document.getElementById('desan-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'desan-toast-container';
      container.className = 'fixed bottom-20 right-6 z-50 flex flex-col gap-2 pointer-events-none';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `px-4 py-3 rounded-lg shadow-lg font-mono text-xs flex items-center gap-2.5 transition-all duration-300 transform translate-y-2 opacity-0 pointer-events-auto ${
      type === 'error'
        ? 'bg-rose-600 text-white'
        : 'bg-slate-900 text-white border border-slate-700'
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
  // 1. SPA ROUTER & NAVIGATION
  // ==========================================
  function initRouter() {
    const pages = document.querySelectorAll('[data-page]');
    const desktopNavLinks = document.querySelectorAll('#desktop-nav [data-nav-target]');
    const mobileNavLinks = document.querySelectorAll('#mobile-nav [data-nav-target]');

    function navigate(targetId) {
      if (!targetId) targetId = 'home';
      const actualPage = targetId === 'tambur' ? 'rulo' : targetId;

      pages.forEach(page => {
        if (page.getAttribute('data-page') === actualPage) {
          page.classList.remove('hidden');
        } else {
          page.classList.add('hidden');
        }
      });

      desktopNavLinks.forEach(link => {
        const linkTarget = link.getAttribute('data-nav-target');
        const isActive = (linkTarget === targetId) || (linkTarget === 'rulo' && targetId === 'tambur');
        if (isActive) {
          link.className = 'text-[#0284c7] font-bold border-b-2 border-[#0284c7] py-2 transition-all shrink-0';
        } else {
          link.className = 'text-slate-800 hover:text-[#0284c7] py-2 transition-colors shrink-0 font-medium';
        }
      });

      mobileNavLinks.forEach(link => {
        const linkTarget = link.getAttribute('data-nav-target');
        const isActive = (linkTarget === targetId) || (linkTarget === 'rulo' && targetId === 'tambur');
        if (isActive) {
          link.className = 'mobile-nav-item flex items-center gap-3 px-3.5 py-3 rounded-lg bg-sky-50 text-[#0284c7] font-bold transition-all';
        } else {
          link.className = 'mobile-nav-item flex items-center gap-3 px-3.5 py-3 rounded-lg text-slate-700 hover:bg-slate-50 hover:text-[#0284c7] font-medium transition-all';
        }
      });

      const cartBtn = document.getElementById('header-cart-btn');
      if (cartBtn) {
        if (targetId === 'sepet') {
          cartBtn.classList.add('ring-2', 'ring-[#0284c7]', 'bg-sky-100');
        } else {
          cartBtn.classList.remove('ring-2', 'ring-[#0284c7]', 'bg-sky-100');
        }
      }

      if (targetId === 'tambur') {
        window.dispatchEvent(new CustomEvent('app:set-rulo-mode', { detail: { tambur: true } }));
      } else if (targetId === 'rulo') {
        window.dispatchEvent(new CustomEvent('app:set-rulo-mode', { detail: { tambur: false } }));
      }

      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    document.addEventListener('click', e => {
      const target = e.target.closest('[data-nav-target], a[href^="#"]');
      if (!target) return;

      let navTarget = target.getAttribute('data-nav-target');
      if (!navTarget && target.getAttribute('href')) {
        const href = target.getAttribute('href');
        if (href.startsWith('#') && href.length > 1) {
          navTarget = href.substring(1);
        }
      }

      if (navTarget) {
        e.preventDefault();
        window.location.hash = navTarget;
        navigate(navTarget);
      }
    });

    function handleHash() {
      const hash = window.location.hash.replace('#', '') || 'home';
      navigate(hash);
    }

    window.addEventListener('hashchange', handleHash);
    handleHash();
  }

  // MOBILE NAVIGATION DRAWER
  function initMobileMenu() {
    const toggleBtn = document.getElementById('mobile-menu-toggle');
    const closeBtn = document.getElementById('mobile-menu-close');
    const drawer = document.getElementById('mobile-menu-drawer');
    const backdrop = document.getElementById('mobile-menu-backdrop');
    const icon = document.getElementById('mobile-menu-icon');

    if (!toggleBtn || !drawer || !backdrop) return;
    let isOpen = false;

    function openMenu() {
      isOpen = true;
      drawer.classList.remove('translate-x-full');
      backdrop.classList.remove('opacity-0', 'pointer-events-none');
      backdrop.classList.add('opacity-100');
      document.body.classList.add('overflow-hidden');
      if (icon) icon.textContent = 'close';
    }

    function closeMenu() {
      isOpen = false;
      drawer.classList.add('translate-x-full');
      backdrop.classList.add('opacity-0', 'pointer-events-none');
      backdrop.classList.remove('opacity-100');
      document.body.classList.remove('overflow-hidden');
      if (icon) icon.textContent = 'menu';
    }

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isOpen) closeMenu();
      else openMenu();
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeMenu();
      });
    }

    backdrop.addEventListener('click', closeMenu);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) closeMenu();
    });
    drawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => closeMenu());
    });
  }

  // ==========================================
  // 2. QUICK HOME CALCULATOR
  // ==========================================
  function initHomeCalculator() {
    const beltSelect = document.getElementById('calc-belt');
    const widthInput = document.getElementById('calc-width');
    const lengthInput = document.getElementById('calc-length');
    const priceDisplay = document.getElementById('calc-price');
    const addBtn = document.getElementById('btn-home-calc-add');

    function updatePrice() {
      if (!beltSelect || !widthInput || !lengthInput || !priceDisplay) return;

      const db = getDB();
      const formulas = db.pricing_formulas || DEFAULT_DB.pricing_formulas;
      const baseCurr = formulas.base_currency || 'TRY';
      const beltRates = formulas.belt_base_rates || { RUB: 4250, PVC: 2600, PU: 3800, GRP: 3400 };

      let basePerMeter = 4250;
      if (beltSelect.value) {
        const selectedVal = beltSelect.value;
        if (selectedVal.includes('2600') || beltSelect.selectedIndex === 1) basePerMeter = beltRates.PVC;
        else if (selectedVal.includes('3800') || beltSelect.selectedIndex === 2) basePerMeter = beltRates.PU;
        else if (selectedVal.includes('3400') || beltSelect.selectedIndex === 3) basePerMeter = beltRates.GRP;
        else basePerMeter = beltRates.RUB;
      }

      const width = parseFloat(widthInput.value) || 650;
      const length = parseFloat(lengthInput.value) || 25;
      const jointRadios = document.getElementsByName('joint');
      
      const spliceCosts = formulas.splice_costs || { SP: 1450, MK: 450, RO: 0 };
      let jointCost = 0;
      for (const radio of jointRadios) {
        if (radio.checked && radio.value === 'endless') {
          jointCost = spliceCosts.SP || 1450;
        }
      }

      const basePerMeterTL = convertBaseToTL(basePerMeter, baseCurr);
      const jointCostTL = convertBaseToTL(jointCost, baseCurr);
      const widthFactor = width / 1000;
      const totalTL = Math.round(basePerMeterTL * widthFactor * length + jointCostTL);
      priceDisplay.textContent = formatMoney(totalTL);
    }

    if (beltSelect && widthInput && lengthInput && priceDisplay) {
      beltSelect.addEventListener('change', updatePrice);
      widthInput.addEventListener('input', updatePrice);
      lengthInput.addEventListener('input', updatePrice);
      document.querySelectorAll('input[name="joint"]').forEach(el => {
        el.addEventListener('change', updatePrice);
      });
      updatePrice();
    }

    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const db = getDB();
        const formulas = db.pricing_formulas || DEFAULT_DB.pricing_formulas;
        const baseCurr = formulas.base_currency || 'TRY';
        const beltRates = formulas.belt_base_rates || { RUB: 4250, PVC: 2600, PU: 3800, GRP: 3400 };
        const spliceCosts = formulas.splice_costs || { SP: 1450, MK: 450, RO: 0 };

        const beltName = beltSelect.options[beltSelect.selectedIndex].text;
        const width = widthInput.value;
        const length = lengthInput.value;

        let basePerMeter = beltRates.RUB;
        if (beltSelect.selectedIndex === 1) basePerMeter = beltRates.PVC;
        else if (beltSelect.selectedIndex === 2) basePerMeter = beltRates.PU;
        else if (beltSelect.selectedIndex === 3) basePerMeter = beltRates.GRP;

        const jointEndless = document.querySelector('input[name="joint"][value="endless"]')?.checked;
        const jointCost = jointEndless ? (spliceCosts.SP || 1450) : 0;
        const basePerMeterTL = convertBaseToTL(basePerMeter, baseCurr);
        const jointCostTL = convertBaseToTL(jointCost, baseCurr);
        const totalTL = Math.round(basePerMeterTL * (parseFloat(width) / 1000) * parseFloat(length) + jointCostTL);

        state.cart.push({
          id: 'c_' + Date.now(),
          title: beltName.split('(')[0].trim(),
          desc: `Genişlik: ${width}mm, Uzunluk: ${length}m, ${jointEndless ? 'Sonsuz Vulkanize' : 'Açık Uçlu'}`,
          qty: 1,
          unit: 'ad',
          unitPrice: totalTL,
          image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJhwVnmEkAv7dIdgZxkefDEhnA7l_wQqq01Tv9xIZIQ2fz_SLfah6mJpUXWrY4D_qiK3UEUcsB4NOZZcTdaJTklC69pPLMP-tvd_dDnEMwwKtPcyyBWeQRyYdwfF4fNum5jAdYaO-tTtit7COu_xxZ8gT_rurWZhfREPg658iwLK5XoIyTiGeLny-Yk0pvyNMbJ2ifhj5x8H7_I8l3-uTUBo8Aa-7-bzAwnE_HaAbrmZxZ8pPpbUbT'
        });

        renderCart();
        showToast('Konveyör Bandı teklif sepetinize eklendi!');
        window.location.hash = 'sepet';
      });
    }
  }

  // ==========================================
  // 3. BANT HESAPLAMA MOTORU
  // ==========================================
  function initBantCalculator() {
    const widthInput = document.getElementById('width-input');
    const lengthInput = document.getElementById('length-input');
    const metersBadge = document.getElementById('meters-badge');
    const tensileSelect = document.getElementById('tensile-strength');
    const coatingSelect = document.getElementById('coating-thickness');
    const skuDisplay = document.getElementById('sku-display');
    const specMaterial = document.getElementById('spec-material');
    const specThickness = document.getElementById('spec-thickness');
    const specDimensions = document.getElementById('spec-dimensions');
    const specTermin = document.getElementById('spec-termin');
    const specUnitPrice = document.getElementById('spec-unit-price');
    const specTotalPrice = document.getElementById('spec-total-price');
    const svgLengthText = document.getElementById('svg-length-text');
    const svgWidthText = document.getElementById('svg-width-text');
    const svgSpliceLabel = document.getElementById('svg-splice-label');
    const addCartBtn = document.getElementById('btn-bant-add-cart');

    if (!widthInput || !lengthInput) return;

    let currentMaterial = 'RUB';
    let currentSplice = 'SP';
    let currentSpliceLabel = 'SICAK EK';
    let currentTermin = 'Vulkanize / 24-48 Saat İkitelli Sevk';

    function updateCalculation() {
      const db = getDB();
      const formulas = db.pricing_formulas || DEFAULT_DB.pricing_formulas;
      const baseCurr = formulas.base_currency || 'TRY';
      const beltRates = formulas.belt_base_rates || { RUB: 4250, PVC: 2600, PU: 3800, GRP: 3400 };

      const w = parseFloat(widthInput.value) || 650;
      const l = parseFloat(lengthInput.value) || 12500;
      const meters = l / 1000;
      const tensileVal = tensileSelect?.value || 'EP400';
      const thicknessVal = coatingSelect?.value || '4+2 mm';

      if (metersBadge) metersBadge.textContent = meters.toFixed(2) + ' Metre';
      if (specDimensions) specDimensions.textContent = meters.toFixed(2) + ' m × ' + w + ' mm';
      if (specThickness) specThickness.textContent = thicknessVal;

      if (svgLengthText) svgLengthText.textContent = 'L: ' + Math.round(l) + ' mm';
      if (svgWidthText) svgWidthText.textContent = 'W: ' + Math.round(w) + ' mm';
      if (svgSpliceLabel) svgSpliceLabel.textContent = currentSpliceLabel;

      if (tensileSelect && specMaterial) {
        const optText = tensileSelect.options[tensileSelect.selectedIndex].text;
        specMaterial.textContent = optText.split(' ')[0] + ' (3 Kat Bez)';
      }
      if (specTermin) specTermin.textContent = currentTermin;

      const sku = 'DSN-' + currentMaterial + '-' + tensileVal + '-W' + Math.round(w) + '-L' + Math.round(l) + '-' + currentSplice;
      if (skuDisplay) skuDisplay.textContent = sku;

      const effectiveRate = beltRates[currentMaterial] || beltRates.RUB || 4250;
      const effectiveRateTL = convertBaseToTL(effectiveRate, baseCurr);
      const unitMeterPriceTL = effectiveRateTL * (w / 650);
      const totalPriceTL = unitMeterPriceTL * meters;

      if (specUnitPrice) {
        specUnitPrice.innerHTML = `${formatMoney(unitMeterPriceTL)} <span class="text-[11px] text-slate-500 font-normal">/ m</span>`;
      }
      if (specTotalPrice) {
        specTotalPrice.textContent = formatMoney(totalPriceTL);
      }
    }

    const materialOptions = document.querySelectorAll('.material-option');
    materialOptions.forEach(card => {
      card.addEventListener('click', function () {
        materialOptions.forEach(c => {
          c.classList.remove('bg-sky-50/60', 'border-2', 'border-[#0284C7]', 'shadow-sm');
          c.classList.add('bg-white', 'border', 'border-slate-200');
          const icon = c.querySelector('.check-icon');
          if (icon) {
            icon.textContent = 'radio_button_unchecked';
            icon.classList.remove('text-[#0284C7]');
            icon.classList.add('text-slate-300');
          }
        });

        card.classList.remove('bg-white', 'border-slate-200');
        card.classList.add('bg-sky-50/60', 'border-2', 'border-[#0284C7]', 'shadow-sm');
        const radio = card.querySelector('input[type="radio"]');
        if (radio) {
          radio.checked = true;
          currentMaterial = radio.value;
        }

        const icon = card.querySelector('.check-icon');
        if (icon) {
          icon.textContent = 'check_circle';
          icon.classList.remove('text-slate-300');
          icon.classList.add('text-[#0284C7]');
        }

        updateCalculation();
      });
    });

    const quickBtns = document.querySelectorAll('.quick-w-btn');
    quickBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        quickBtns.forEach(b => {
          b.classList.remove('bg-[#0284C7]', 'text-white', 'font-bold');
          b.classList.add('bg-slate-100', 'text-slate-700');
        });
        btn.classList.remove('bg-slate-100', 'text-slate-700');
        btn.classList.add('bg-[#0284C7]', 'text-white', 'font-bold');

        widthInput.value = btn.dataset.val;
        updateCalculation();
      });
    });

    const spliceBtns = document.querySelectorAll('.splice-btn');
    spliceBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        spliceBtns.forEach(b => {
          b.classList.remove('border-2', 'border-[#0284C7]', 'bg-sky-50/50');
          b.classList.add('border-slate-200', 'bg-white');
          const spIcon = b.querySelector('.splice-icon');
          if (spIcon) {
            spIcon.textContent = 'radio_button_unchecked';
            spIcon.classList.replace('text-[#0284C7]', 'text-slate-300');
          }
        });

        btn.classList.remove('border-slate-200', 'bg-white');
        btn.classList.add('border-2', 'border-[#0284C7]', 'bg-sky-50/50');
        const spIcon = btn.querySelector('.splice-icon');
        if (spIcon) {
          spIcon.textContent = 'check_circle';
          spIcon.classList.replace('text-slate-300', 'text-[#0284C7]');
        }

        currentSplice = btn.dataset.splice || 'SP';
        currentSpliceLabel = btn.dataset.splicelabel || 'SICAK EK';
        currentTermin = btn.dataset.termin || 'Vulkanize / 24-48 Saat İkitelli Sevk';
        updateCalculation();
      });
    });

    widthInput.addEventListener('input', updateCalculation);
    lengthInput.addEventListener('input', updateCalculation);
    tensileSelect?.addEventListener('change', updateCalculation);
    coatingSelect?.addEventListener('change', updateCalculation);

    updateCalculation();

    if (addCartBtn) {
      addCartBtn.addEventListener('click', () => {
        const db = getDB();
        const formulas = db.pricing_formulas || DEFAULT_DB.pricing_formulas;
        const baseCurr = formulas.base_currency || 'TRY';
        const beltRates = formulas.belt_base_rates || { RUB: 4250, PVC: 2600, PU: 3800, GRP: 3400 };

        const w = widthInput.value;
        const l = lengthInput.value;
        const sku = skuDisplay ? skuDisplay.textContent : 'DSN-RUB';
        const meters = (parseFloat(l) / 1000).toFixed(2);

        const effectiveRate = beltRates[currentMaterial] || beltRates.RUB || 4250;
        const effectiveRateTL = convertBaseToTL(effectiveRate, baseCurr);
        const unitMeterPriceTL = effectiveRateTL * (parseFloat(w) / 650);
        const totalPriceTL = Math.round(unitMeterPriceTL * parseFloat(meters));

        state.cart.push({
          id: 'c_' + Date.now(),
          title: `Özel Kesim Bant (${sku})`,
          desc: `Genişlik: ${w}mm, Metraj: ${meters}m, ${currentSpliceLabel}`,
          qty: 1,
          unit: 'hat',
          unitPrice: totalPriceTL,
          image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJhwVnmEkAv7dIdgZxkefDEhnA7l_wQqq01Tv9xIZIQ2fz_SLfah6mJpUXWrY4D_qiK3UEUcsB4NOZZcTdaJTklC69pPLMP-tvd_dDnEMwwKtPcyyBWeQRyYdwfF4fNum5jAdYaO-tTtit7COu_xxZ8gT_rurWZhfREPg658iwLK5XoIyTiGeLny-Yk0pvyNMbJ2ifhj5x8H7_I8l3-uTUBo8Aa-7-bzAwnE_HaAbrmZxZ8pPpbUbT'
        });

        renderCart();
        showToast('Özel kesim konveyör bandı teklif sepetinize eklendi!');
        window.location.hash = 'sepet';
      });
    }
  }

  // ==========================================
  // 4. RULO VALİDASYONU VE HESAPLAMA MOTORU
  // ==========================================
  function initRuloCalculator() {
    const selectD = document.getElementById('select-d');
    const selectMil = document.getElementById('select-mil');
    const inputL = document.getElementById('input-l');
    const inputA = document.getElementById('input-a');
    const inputQty = document.getElementById('input-qty');
    const btnQtyMinus = document.getElementById('btn-qty-minus');
    const btnQtyPlus = document.getElementById('btn-qty-plus');

    const svgTextL = document.getElementById('svg-text-l');
    const svgTextA = document.getElementById('svg-text-a');
    const svgTextD = document.getElementById('svg-text-d');
    const svgTextMil = document.getElementById('svg-text-mil');

    const summaryD = document.getElementById('summary-d');
    const summaryMil = document.getElementById('summary-mil');
    const summaryL = document.getElementById('summary-l');
    const summaryA = document.getElementById('summary-a');
    const summaryKaplama = document.getElementById('summary-kaplama');

    const validationBox = document.getElementById('validation-box');
    const skuBadge = document.getElementById('sku-badge');
    const badgeStatus = document.getElementById('badge-status');
    const priceUnit = document.getElementById('price-unit');
    const priceTotal = document.getElementById('price-total');
    const bulkDiscountNote = document.getElementById('bulk-discount-note');
    const addCartBtn = document.getElementById('btn-rulo-add-cart');
    const tabRulo = document.getElementById('tab-rulo');
    const tabTambur = document.getElementById('tab-tambur');

    if (!selectD || !inputL || !inputA) return;

    let isTamburMode = false;
    let currentMilCode = 'F14';
    let currentKaplamaExtra = 0;

    function setMode(tambur) {
      isTamburMode = tambur;
      if (tabRulo && tabTambur) {
        if (isTamburMode) {
          tabTambur.className = 'flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-mono font-bold bg-[#0284C7] text-white shadow-sm border border-[#0284C7] transition-all cursor-pointer active:scale-95';
          tabRulo.className = 'green-signal-tab flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-mono font-medium text-slate-600 hover:bg-slate-50 border border-transparent transition-all cursor-pointer active:scale-95';
        } else {
          tabRulo.className = 'flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-mono font-bold bg-[#0284C7] text-white shadow-sm border border-[#0284C7] transition-all cursor-pointer active:scale-95';
          tabTambur.className = 'green-signal-tab flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-mono font-medium text-slate-600 hover:bg-slate-50 border border-transparent transition-all cursor-pointer active:scale-95';
        }
      }

      if (isTamburMode) {
        selectD.innerHTML = `
          <option value="219" selected>Ø219 mm (Et Kalınlığı 8 mm)</option>
          <option value="273">Ø273 mm (Et Kalınlığı 10 mm)</option>
          <option value="324">Ø324 mm (Et Kalınlığı 12 mm)</option>
          <option value="406">Ø406 mm (Et Kalınlığı 14 mm)</option>
          <option value="508">Ø508 mm (Et Kalınlığı 16 mm Ağır Hizmet)</option>
          <option value="630">Ø630 mm (Et Kalınlığı 20 mm Maden Tipi)</option>
        `;
        selectMil.innerHTML = `
          <option value="50">Ø50 mm (Ç1040 Islah Çeliği)</option>
          <option value="60" selected>Ø60 mm (Ç1040 Islah Çeliği)</option>
          <option value="75">Ø75 mm (Ağır Hizmet Faturalı)</option>
          <option value="90">Ø90 mm (Ağır Hizmet Faturalı)</option>
          <option value="110">Ø110 mm (Maden / Agrega Tipi)</option>
          <option value="130">Ø130 mm (Konik Kilitli Montaj)</option>
        `;
        inputL.value = '950';
        inputA.value = '1150';
      } else {
        selectD.innerHTML = `
          <option value="60">Ø60 mm (Boru Et Kalınlığı 3 mm)</option>
          <option value="76">Ø76 mm (Boru Et Kalınlığı 3.2 mm)</option>
          <option value="89" selected>Ø89 mm (Boru Et Kalınlığı 3.65 mm)</option>
          <option value="108">Ø108 mm (Boru Et Kalınlığı 4 mm)</option>
          <option value="133">Ø133 mm (Boru Et Kalınlığı 4.5 mm)</option>
          <option value="159">Ø159 mm (Boru Et Kalınlığı 5 mm Ağır Hizmet)</option>
        `;
        selectMil.innerHTML = `
          <option value="20" selected>Ø20 mm (Ç1040 İmalat Çeliği)</option>
          <option value="25">Ø25 mm (Ç1040 İmalat Çeliği)</option>
          <option value="30">Ø30 mm (Ağır Hizmet Rulman Grubu)</option>
          <option value="35">Ø35 mm (Ağır Hizmet Rulman Grubu)</option>
        `;
        inputL.value = '315';
        inputA.value = '355';
      }
      updateConfig();
    }

    if (tabRulo) {
      tabRulo.addEventListener('click', () => {
        setMode(false);
        window.location.hash = 'rulo';
      });
    }
    if (tabTambur) {
      tabTambur.addEventListener('click', () => {
        setMode(true);
        window.location.hash = 'tambur';
      });
    }

    window.addEventListener('app:set-rulo-mode', (e) => {
      if (e && e.detail !== undefined) {
        setMode(!!e.detail.tambur);
      }
    });

    if (window.location.hash === '#tambur') {
      setMode(true);
    }

    function updateConfig() {
      const d = selectD.value;
      const mil = selectMil.value;
      const l = parseInt(inputL.value) || 0;
      const a = parseInt(inputA.value) || 0;
      const qty = parseInt(inputQty?.value) || 1;

      if (svgTextD) svgTextD.textContent = `Ø D: ${d} mm`;
      if (svgTextMil) svgTextMil.textContent = `Ød:${mil}`;
      if (svgTextL) svgTextL.textContent = `L: ${l} mm`;
      if (svgTextA) svgTextA.textContent = `A: ${a} mm`;

      if (summaryD) summaryD.textContent = `Ø${d} × 3.5 mm (DIN 2394)`;
      if (summaryMil) summaryMil.textContent = selectMil.options[selectMil.selectedIndex].text;
      if (summaryL) summaryL.textContent = `${l} mm`;
      if (summaryA) summaryA.textContent = `${a} mm`;

      const diff = a - l;
      const isToleranceValid = diff >= 30;

      if (isToleranceValid) {
        if (validationBox) {
          validationBox.className = 'p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs font-mono text-emerald-800 transition-all';
          validationBox.innerHTML = `
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
              <span><strong>✓ Tolerans Kontrolü:</strong> Mil Boyu (A), Boru Boyundan (L) en az 30 mm uzun olmalıdır. (Mevcut Fark: <strong>${diff} mm</strong>) - İMALATA UYGUN</span>
            </div>
            <span class="bg-emerald-600 text-white text-[10px] uppercase font-bold px-2.5 py-0.5 rounded tracking-wide">Geçerli</span>
          `;
        }
        if (badgeStatus) {
          badgeStatus.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200';
          badgeStatus.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Üretilebilir / Onaylı`;
        }
        inputA.classList.remove('border-rose-400', 'bg-rose-50');

        if (addCartBtn) {
          addCartBtn.disabled = false;
          addCartBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
        }
      } else {
        if (validationBox) {
          validationBox.className = 'p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between text-xs font-mono text-rose-800 transition-all';
          validationBox.innerHTML = `
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px] text-rose-600">warning</span>
              <span><strong>⚠️ Tolerans Uyarısı:</strong> Mil Boyu (A) yetersiz! Boru boyundan en az 30 mm uzun olmalıdır. (Mevcut Fark: <strong>${diff} mm</strong>)</span>
            </div>
            <span class="bg-rose-600 text-white text-[10px] uppercase font-bold px-2.5 py-0.5 rounded tracking-wide">Hatalı Ölçü</span>
          `;
        }
        if (badgeStatus) {
          badgeStatus.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-rose-50 text-rose-700 border border-rose-200';
          badgeStatus.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Tolerans Hatası`;
        }
        inputA.classList.add('border-rose-400', 'bg-rose-50');

        if (addCartBtn) {
          addCartBtn.disabled = true;
          addCartBtn.classList.add('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
        }
      }

      if (skuBadge) skuBadge.textContent = `DSN-ROL-D${d}-L${l}-A${a}-${currentMilCode}`;

      const baseUnit = isTamburMode
        ? 3200 + parseInt(d) * 8.5 + parseInt(l) * 2.8 + currentKaplamaExtra * 2
        : 280 + parseInt(d) * 2.1 + l * 0.55 + parseInt(mil) * 3 + currentKaplamaExtra;
      const finalUnit = Math.round(baseUnit);
      const discountRate = qty >= 25 ? 0.9 : 1.0;
      const total = Math.round(finalUnit * qty * discountRate);

      if (priceUnit) priceUnit.textContent = `${formatMoney(finalUnit)} / adet`;
      if (priceTotal) priceTotal.textContent = formatMoney(total);

      if (bulkDiscountNote) {
        if (qty >= 25) {
          bulkDiscountNote.textContent = `✨ %10 Proje İskontosu Uygulandı (${qty} adet)`;
          bulkDiscountNote.className = 'font-mono text-[11px] text-emerald-700 text-right font-semibold';
        } else {
          bulkDiscountNote.textContent = `✨ 25+ adette %10 proje iskontosu uygulanır.`;
          bulkDiscountNote.className = 'font-mono text-[11px] text-emerald-700 text-right';
        }
      }
    }

    selectD.addEventListener('change', updateConfig);
    selectMil.addEventListener('change', updateConfig);
    inputL.addEventListener('input', updateConfig);
    inputA.addEventListener('input', updateConfig);

    if (btnQtyMinus && inputQty) {
      btnQtyMinus.addEventListener('click', () => {
        let q = parseInt(inputQty.value) || 1;
        if (q > 1) {
          inputQty.value = q - 1;
          updateConfig();
        }
      });
    }

    if (btnQtyPlus && inputQty) {
      btnQtyPlus.addEventListener('click', () => {
        let q = parseInt(inputQty.value) || 1;
        inputQty.value = q + 1;
        updateConfig();
      });
    }

    updateConfig();

    if (addCartBtn) {
      addCartBtn.addEventListener('click', () => {
        const d = selectD.value;
        const l = inputL.value;
        const a = inputA.value;
        const qty = parseInt(inputQty?.value) || 1;
        const sku = skuBadge ? skuBadge.textContent : (isTamburMode ? 'DSN-TMB' : 'DSN-ROL');
        const baseUnit = isTamburMode
          ? 3200 + parseInt(d) * 8.5 + parseInt(l) * 2.8 + currentKaplamaExtra * 2
          : 280 + parseInt(d) * 2.1 + parseInt(l) * 0.55 + 20 * 3 + currentKaplamaExtra;
        const finalUnit = Math.round(baseUnit);
        const itemTitle = isTamburMode ? `Özel İmalat Tahrik/Gergi Tamburu (${sku})` : `Özel İmalat Rulo (${sku})`;
        const itemDesc = isTamburMode ? `Gövde: Ø${d}mm, L: ${l}mm, Mil: ${a}mm, ${summaryKaplama ? summaryKaplama.textContent : 'Standart'}` : `Ø${d} mm, L: ${l}mm, A: ${a}mm, ${summaryKaplama ? summaryKaplama.textContent : 'Standart'}`;

        state.cart.push({
          id: 'c_' + Date.now(),
          title: itemTitle,
          desc: itemDesc,
          qty: qty,
          unit: 'ad',
          unitPrice: finalUnit,
          image: isTamburMode
            ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuDFk0NuvpzHvs0XHGAM_11Z2V_ioDUVMIspsnKmKSYcVBu-PlYGKS6QE0UUNIn9vGkCMLO5uS4v7DwqhRRtCORbUShUUKQNpPiL-S6hXtinj1WPgl9DNJ_PtsnnXzmYGOH7KUkv4F_Wtwt_cMaCthL1FwNGxs6yftmxvyY0mpqgWQKxVA9ai-TZnPewvcttaZW6ZWQArdaXSJO3rdupYdpY5XYCa-X1YgoN96IcqN6DCegcW1HCgTtP'
            : 'https://lh3.googleusercontent.com/aida-public/AB6AXuBDXU98gVd288k6wB9YuZoN3Le3og3wl6oNnuHmH_8WLxRvmNK9Oh38GcNcnXjsEiEGx7jFSrFVnHSsYE9qyuuY2YDYYWZeKcESfG5tUsm87nVeMqr_VYTNH19UEFJB5VmASI_9pLJxdWdLfrAnJjyaO95ZwPPHidli-UhWrx4XAHqCdqOzm5jSPcxz_cRMygoCpy0tZissaGqOFT9c7Nnvj2nNM7yFpZ1YChw9IQ7pBimJYDgGM_3g'
        });

        renderCart();
        showToast(isTamburMode ? 'Özel imalat tambur teklif sepetinize eklendi!' : 'Özel imalat rulo teklif sepetinize eklendi!');
        window.location.hash = 'sepet';
      });
    }
  }

  // ==========================================
  // 5. SEPET TABLOSU & PROFORMA
  // ==========================================
  function renderCart() {
    saveCartToStorage();

    const activeCari = getActiveCari();
    const db = getDB();
    const formulas = db.pricing_formulas || DEFAULT_DB.pricing_formulas;
    const defaultDiscountPercent = formulas.b2b_discount_percent ?? 15;
    const currentDiscountPercent = activeCari ? activeCari.custom_discount_percent : defaultDiscountPercent;
    const b2bDiscountRate = currentDiscountPercent / 100;
    const vatRate = (formulas.vat_percent ?? 20) / 100;

    const dateEl = document.getElementById('print-proforma-date');
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString('tr-TR');
    }

    const tbody = document.getElementById('cart-table-body');
    const headerCartBadge = document.getElementById('header-cart-count');
    const tableBadge = document.getElementById('cart-item-count-badge');
    const subtotalEl = document.getElementById('proforma-subtotal') || document.getElementById('cart-subtotal');
    const discountEl = document.getElementById('proforma-discount');
    const netEl = document.getElementById('proforma-net');
    const vatEl = document.getElementById('proforma-vat') || document.getElementById('cart-tax');
    const totalEl = document.getElementById('proforma-total') || document.getElementById('cart-grand-total');
    const emptyMsg = document.getElementById('cart-empty-msg');

    const totalKalem = state.cart.length;
    if (headerCartBadge) headerCartBadge.textContent = `Teklif Sepetim (${totalKalem} Kalem)`;
    const mobileCartBadge = document.getElementById('mobile-cart-label');
    if (mobileCartBadge) mobileCartBadge.textContent = `Teklif Sepetim (${totalKalem} Kalem)`;
    if (tableBadge) tableBadge.textContent = `Toplam ${totalKalem} Kalem`;

    const tableWrapper = document.getElementById('cart-table-wrapper');

    if (totalKalem === 0) {
      if (emptyMsg) emptyMsg.classList.remove('hidden');
      if (tableWrapper) tableWrapper.classList.add('hidden');
      if (tbody) tbody.innerHTML = '';
      if (subtotalEl) subtotalEl.textContent = formatMoney(0);
      if (discountEl) discountEl.textContent = `- ${formatMoney(0)}`;
      if (netEl) netEl.textContent = formatMoney(0);
      if (vatEl) vatEl.textContent = formatMoney(0);
      if (totalEl) totalEl.textContent = formatMoney(0);
      return;
    }

    if (emptyMsg) emptyMsg.classList.add('hidden');
    if (tableWrapper) tableWrapper.classList.remove('hidden');
    if (!tbody) return;

    let subtotal = 0;
    tbody.innerHTML = '';

    state.cart.forEach((item, index) => {
      const rowTotal = item.qty * item.unitPrice;
      subtotal += rowTotal;
      const rowNum = String(index + 1).padStart(2, '0');

      const tr = document.createElement('tr');
      tr.className = 'group hover:bg-slate-50/70 transition-colors';
      tr.innerHTML = `
        <td class="py-4 pl-2 font-mono text-slate-400 text-xs">${rowNum}</td>
        <td class="py-4 pr-4">
          <div class="flex gap-3.5 items-center">
            <div class="w-12 h-12 bg-slate-100 rounded border border-[#CBD5E1] flex items-center justify-center shrink-0 overflow-hidden">
              <img alt="${item.title}" class="w-full h-full object-cover" src="${item.image}" />
            </div>
            <div class="flex flex-col">
              <span class="font-semibold text-slate-900 group-hover:text-[#0284C7] transition-colors">${item.title}</span>
              <span class="text-xs text-slate-500">${item.desc}</span>
            </div>
          </div>
        </td>
        <td class="py-4 text-center">
          <div class="inline-flex items-center bg-white border border-slate-300 rounded-lg shadow-2xs text-xs font-mono overflow-hidden">
            <button class="cart-minus-btn px-2.5 py-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-bold transition-all cursor-pointer active:scale-90 select-none" data-id="${item.id}">-</button>
            <span class="px-2.5 py-1 text-center min-w-[56px] font-semibold border-x border-slate-200 text-slate-800 bg-slate-50/50">${item.qty} ${item.unit}</span>
            <button class="cart-plus-btn px-2.5 py-1 text-slate-600 hover:bg-slate-100 hover:text-[#0284c7] font-bold transition-all cursor-pointer active:scale-90 select-none" data-id="${item.id}">+</button>
          </div>
        </td>
        <td class="py-4 text-right pr-3 font-mono text-slate-700 text-xs">${formatMoney(item.unitPrice)}</td>
        <td class="py-4 text-right pr-3 font-mono font-bold text-slate-900 text-xs">${formatMoney(rowTotal)}</td>
        <td class="py-4 text-right">
          <button class="cart-delete-btn text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg p-1.5 transition-all cursor-pointer active:scale-90 inline-flex items-center justify-center" data-id="${item.id}" title="Sil">
            <span class="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    const discount = subtotal * b2bDiscountRate;
    const net = subtotal - discount;
    const vat = net * vatRate;
    const generalTotal = net + vat;

    if (subtotalEl) subtotalEl.textContent = formatMoney(subtotal);
    if (discountEl) discountEl.textContent = `- ${formatMoney(discount)}`;
    if (netEl) netEl.textContent = formatMoney(net);
    if (vatEl) vatEl.textContent = formatMoney(vat);
    if (totalEl) totalEl.textContent = formatMoney(generalTotal);

    updateProformaTemplate();
  }

  function updateProformaTemplate() {
    const activeCari = getActiveCari();
    const db = getDB();
    const companyInput = document.getElementById('company-name')?.value || (activeCari ? activeCari.company_name : 'Ods Madencilik ve Lojistik A.Ş.');
    const taxInput = document.getElementById('tax-number')?.value || (activeCari ? (activeCari.tax_office ? activeCari.tax_office + ' / ' + activeCari.tax_id : activeCari.tax_id) : 'İkitelli V.D.: 2931175671');
    const addressInput = document.getElementById('address')?.value || (activeCari ? activeCari.address : 'İkitelli Organize San. Böl. Atatürk Oto San. Sitesi 19. Sokak No:545 Başakşehir / İSTANBUL');
    const contactInput = document.getElementById('contact-person')?.value || (activeCari ? activeCari.authorized_person : 'Ahmet Yılmaz (Satınalma Md.)');
    const phoneInput = document.getElementById('phone-gsm')?.value || (activeCari ? activeCari.phone : '+90 532 555 12 34');

    const pfCompany = document.getElementById('pf-cust-company');
    const pfTax = document.getElementById('pf-cust-tax');
    const pfAddress = document.getElementById('pf-cust-address');
    const pfContact = document.getElementById('pf-cust-contact');
    const pfDocNo = document.getElementById('pf-doc-no');
    const pfDocDate = document.getElementById('pf-doc-date');

    if (pfCompany) pfCompany.textContent = companyInput;
    if (pfTax) pfTax.textContent = taxInput.includes('V.D.') ? taxInput : `Vergi D./No: ${taxInput}`;
    if (pfAddress) pfAddress.textContent = addressInput;
    if (pfContact) pfContact.textContent = `Yetkili: ${contactInput} ${phoneInput ? '(' + phoneInput + ')' : ''}`;

    if (pfDocNo && pfDocNo.textContent.includes('DSN-PRF-2026-8492')) {
      const randNum = Math.floor(1000 + Math.random() * 9000);
      pfDocNo.textContent = `DSN-PRF-2026-${randNum}`;
    }
    if (pfDocDate) {
      const now = new Date();
      pfDocDate.textContent = now.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    const pfTbody = document.getElementById('pf-items-tbody');
    if (pfTbody) {
      pfTbody.innerHTML = '';
      if (state.cart && state.cart.length > 0) {
        state.cart.forEach((item, index) => {
          const tr = document.createElement('tr');
          tr.className = index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60';
          const itemTotal = item.qty * item.unitPrice;
          tr.innerHTML = `
            <td class="py-2.5 px-3 text-slate-500">${String(index + 1).padStart(2, '0')}</td>
            <td class="py-2.5 px-3 font-semibold text-slate-900">
              <div>${item.title}</div>
              <div class="text-[10px] text-slate-500 font-normal">${item.desc}</div>
            </td>
            <td class="py-2.5 px-3 text-center text-slate-800">${item.qty} ${item.unit || 'ad'}</td>
            <td class="py-2.5 px-3 text-right text-slate-700">${formatMoney(item.unitPrice)}</td>
            <td class="py-2.5 px-3 text-right font-bold text-slate-900">${formatMoney(itemTotal)}</td>
          `;
          pfTbody.appendChild(tr);
        });
      } else {
        pfTbody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-slate-400">Sepette henüz ürün bulunmamaktadır.</td></tr>`;
      }
    }

    const formulas = db.pricing_formulas || DEFAULT_DB.pricing_formulas;
    const currentDiscountPercent = activeCari ? activeCari.custom_discount_percent : (formulas.b2b_discount_percent ?? 15);
    const b2bDiscountRate = currentDiscountPercent / 100;
    const vatRate = (formulas.vat_percent ?? 20) / 100;

    let subtotal = 0;
    state.cart.forEach(item => {
      subtotal += item.qty * item.unitPrice;
    });

    const discount = subtotal * b2bDiscountRate;
    const net = subtotal - discount;
    const vat = net * vatRate;
    const generalTotal = net + vat;

    const pfSub = document.getElementById('pf-sum-subtotal');
    const pfDisc = document.getElementById('pf-sum-discount');
    const pfNet = document.getElementById('pf-sum-net');
    const pfVat = document.getElementById('pf-sum-vat');
    const pfTot = document.getElementById('pf-sum-total');

    if (pfSub) pfSub.textContent = formatMoney(subtotal);
    if (pfDisc) pfDisc.textContent = `- ${formatMoney(discount)}`;
    if (pfNet) pfNet.textContent = formatMoney(net);
    if (pfVat) pfVat.textContent = formatMoney(vat);
    if (pfTot) pfTot.textContent = formatMoney(generalTotal);
  }

  function recordQuoteInDatabase() {
    if (state.cart.length === 0) return;
    const db = getDB();
    const activeCari = getActiveCari();
    const formulas = db.pricing_formulas || DEFAULT_DB.pricing_formulas;
    const b2bDiscountPercent = activeCari ? activeCari.custom_discount_percent : (formulas.b2b_discount_percent ?? 15);
    const vatPercent = formulas.vat_percent ?? 20;

    const companyName = document.getElementById('company-name')?.value || (activeCari ? activeCari.company_name : 'Ods Madencilik ve Lojistik A.Ş.');
    const taxOffice = document.getElementById('tax-number')?.value || (activeCari ? activeCari.tax_office + ' / ' + activeCari.tax_id : 'Gebze V.D. / 6380192831');
    const address = document.getElementById('address')?.value || (activeCari ? activeCari.address : '');
    const contactPerson = document.getElementById('contact-person')?.value || (activeCari ? activeCari.authorized_person : 'Ahmet Yılmaz (Satınalma Md.)');
    const email = document.getElementById('company-email')?.value || (activeCari ? activeCari.email : 'ahmet.yilmaz@odsmadencilik.com');
    const phone = document.getElementById('phone-gsm')?.value || (activeCari ? activeCari.phone : '+90 532 100 20 30');

    let subtotal = 0;
    state.cart.forEach(item => {
      subtotal += item.qty * item.unitPrice;
    });

    const discount = subtotal * (b2bDiscountPercent / 100);
    const net = subtotal - discount;
    const vat = net * (vatPercent / 100);
    const totalTry = net + vat;

    const quotes = db.quotes_archive || [];
    const newRfqId = 'RFQ-2026-' + String(quotes.length + 1).padStart(3, '0');
    const dateStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const customerNotes = document.getElementById('cart-customer-notes')?.value.trim() || '';

    const newQuote = {
      id: newRfqId,
      company: companyName,
      contact_person: contactPerson,
      phone: phone,
      email: email,
      tax_office: taxOffice,
      address: address,
      customer_notes: customerNotes || 'Ek not iletilmedi.',
      items_count: state.cart.length,
      items: state.cart.map(i => ({
        title: i.title,
        desc: i.desc,
        qty: i.qty,
        unit: i.unit,
        unitPrice: i.unitPrice
      })),
      subtotal: subtotal,
      discount_percent: b2bDiscountPercent,
      vat_percent: vatPercent,
      total_try: totalTry,
      date: dateStr,
      status: 'Yeni',
      is_guest: activeCari ? false : true,
      cari_id: activeCari ? activeCari.id : null
    };

    if (!db.quotes_archive) db.quotes_archive = [];
    db.quotes_archive.unshift(newQuote);
    saveDB(db);
  }

  async function triggerProformaPDF() {
    const modal = document.getElementById('pdf-render-modal');
    const sheet = document.getElementById('proforma-a4-sheet');
    const btn = document.getElementById('btn-download-proforma');
    if (!modal || !sheet || !window.html2pdf) {
      showToast('PDF motoru hazır değil. Lütfen sayfayı yenileyin.', 'error');
      return;
    }

    if (state.cart.length === 0) {
      showToast('Teklif sepetiniz boş! Lütfen önce sepetinize ürün ekleyin.', 'error');
      return;
    }

    recordQuoteInDatabase();

    const originalBtnHtml = btn ? btn.innerHTML : '';
    if (btn) {
      btn.innerHTML = '<span>⏳ PDF İndiriliyor...</span>';
      btn.disabled = true;
    }

    try {
      // 1. Verileri şablona doldur
      const docNoEl = document.getElementById('pdf-doc-no');
      const docDateEl = document.getElementById('pdf-doc-date');
      if (docNoEl) docNoEl.innerText = 'DSN-PRF-2026-' + Math.floor(1000 + Math.random() * 9000);
      if (docDateEl) docDateEl.innerText = 'Tarih: ' + new Date().toLocaleDateString('tr-TR');

      const activeCari = getActiveCari();
      const compVal = document.getElementById('cart-company-name')?.value || document.getElementById('company-name')?.value || (activeCari ? activeCari.company_name : 'Münferit Alıcı');
      const taxVal = document.getElementById('cart-tax-info')?.value || document.getElementById('tax-number')?.value || (activeCari ? (activeCari.tax_office ? activeCari.tax_office + ' / ' + activeCari.tax_id : activeCari.tax_id) : 'Belirtilmedi');
      const addrVal = document.getElementById('cart-address')?.value || document.getElementById('address')?.value || (activeCari ? activeCari.address : 'Atölye Teslim');
      const contactVal = document.getElementById('cart-contact-person')?.value || document.getElementById('contact-person')?.value || (activeCari ? activeCari.authorized_person : '');

      const pdfCompany = document.getElementById('pdf-company-name');
      const pdfTax = document.getElementById('pdf-tax-info');
      const pdfAddress = document.getElementById('pdf-address');
      const pdfContact = document.getElementById('pdf-contact-person');

      if (pdfCompany) pdfCompany.innerText = compVal;
      if (pdfTax) pdfTax.innerText = taxVal;
      if (pdfAddress) pdfAddress.innerText = addrVal;
      if (pdfContact) pdfContact.innerText = contactVal;

      const customerNote = document.getElementById('cart-customer-notes')?.value.trim() || '';
      const notesBox = document.getElementById('pdf-customer-notes-box');
      const notesText = document.getElementById('pdf-customer-notes-text');
      if (notesBox && notesText) {
        if (customerNote) {
          notesBox.style.display = 'block';
          notesText.innerText = customerNote;
        } else {
          notesBox.style.display = 'none';
        }
      }

      // Sepetteki kalemleri tabloya dök
      const tbody = document.getElementById('pdf-table-items');
      if (tbody) {
        tbody.innerHTML = '';
        const cartItems = state.cart || window.currentCartItems || [];

        cartItems.forEach((item, index) => {
          const rowTotal = item.qty * item.unitPrice;
          const tr = document.createElement('tr');
          tr.style.borderBottom = '1px solid #e2e8f0';
          tr.innerHTML = `
            <td style="padding: 8px 10px; font-weight: 700;">${String(index + 1).padStart(2, '0')}</td>
            <td style="padding: 8px 10px;">
              <div style="font-weight: 700; color: #0f172a;">${item.title || item.name}</div>
              <div style="font-size: 9px; color: #64748b;">${item.desc || item.description || item.sku || ''}</div>
            </td>
            <td style="padding: 8px 10px; text-align: center; font-weight: 600;">${item.qty || item.quantity} ${item.unit || 'ad'}</td>
            <td style="padding: 8px 10px; text-align: right; font-family: monospace;">${formatMoney(item.unitPrice || item.unit_price)}</td>
            <td style="padding: 8px 10px; text-align: right; font-family: monospace; font-weight: 700;">${formatMoney(rowTotal)}</td>
          `;
          tbody.appendChild(tr);
        });
      }

      // Finansal toplamları aktar
      const pdfSubtotal = document.getElementById('pdf-subtotal');
      const pdfDiscount = document.getElementById('pdf-discount-amount');
      const pdfNet = document.getElementById('pdf-net-total');
      const pdfVat = document.getElementById('pdf-vat-amount');
      const pdfGrand = document.getElementById('pdf-grand-total');

      if (pdfSubtotal) pdfSubtotal.innerText = document.getElementById('proforma-subtotal')?.innerText || document.getElementById('cart-subtotal')?.innerText || '0 ₺';
      if (pdfDiscount) pdfDiscount.innerText = document.getElementById('proforma-discount')?.innerText || document.getElementById('cart-discount')?.innerText || '0 ₺';
      if (pdfNet) pdfNet.innerText = document.getElementById('proforma-net')?.innerText || document.getElementById('cart-net-total')?.innerText || '0 ₺';
      if (pdfVat) pdfVat.innerText = document.getElementById('proforma-vat')?.innerText || document.getElementById('cart-vat')?.innerText || '0 ₺';
      if (pdfGrand) pdfGrand.innerText = document.getElementById('proforma-total')?.innerText || document.getElementById('cart-grand-total')?.innerText || '0 ₺';

      // 2. Modalı kullanıcıya görünür yap
      modal.classList.remove('hidden');
      modal.classList.add('flex');

      // Fontların ve layout'un ekrana tam oturması için 300ms bekle
      await new Promise(r => setTimeout(r, 300));

      // 3. html2pdf ile tam dolu PDF'i üret
      const cleanCompName = compVal.replace(/[^a-zA-Z0-9]/g, '_');
      const opt = {
        margin: 0,
        filename: 'Desan_Proforma_Teklif_' + (cleanCompName || 'Belge') + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          scrollY: 0,
          scrollX: 0
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await window.html2pdf().set(opt).from(sheet).save();
      showToast('Kaşeli Resmi Proforma PDF başarıyla indirildi!');

    } catch (err) {
      console.error('PDF Hatası:', err);
      showToast('PDF oluşturulamadı.', 'error');
    } finally {
      // 4. İndirme bittiğinde modalı derhal gizle ve butonu eski haline getir
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      if (btn) {
        btn.innerHTML = originalBtnHtml;
        btn.disabled = false;
      }
    }
  }

  window.downloadProformaPDF = triggerProformaPDF;
  window.triggerProformaPDF = triggerProformaPDF;

  function initCartEvents() {
    document.addEventListener('click', async e => {
      const plusBtn = e.target.closest('.cart-plus-btn');
      if (plusBtn) {
        const id = plusBtn.getAttribute('data-id');
        const item = state.cart.find(i => i.id === id);
        if (item) {
          item.qty += item.unit === 'm' ? 10 : 1;
          renderCart();
        }
        return;
      }

      const minusBtn = e.target.closest('.cart-minus-btn');
      if (minusBtn) {
        const id = minusBtn.getAttribute('data-id');
        const item = state.cart.find(i => i.id === id);
        if (item) {
          const step = item.unit === 'm' ? 10 : 1;
          if (item.qty > step) {
            item.qty -= step;
          }
          renderCart();
        }
        return;
      }

      const deleteBtn = e.target.closest('.cart-delete-btn');
      if (deleteBtn) {
        const id = deleteBtn.getAttribute('data-id');
        state.cart = state.cart.filter(i => i.id !== id);
        renderCart();
        showToast('Kalem sepetten silindi.');
        return;
      }

      const clearBtn = e.target.closest('#btn-clear-cart');
      if (clearBtn) {
        state.cart = [];
        renderCart();
        showToast('Teklif sepeti temizlendi.');
        return;
      }

      const pdfBtn = e.target.closest('#btn-download-proforma');
      if (pdfBtn) {
        triggerProformaPDF();
        return;
      }

      const repBtn = e.target.closest('#btn-send-rep');
      if (repBtn) {
        if (state.cart.length === 0) {
          showToast('Sepetiniz boş. Lütfen önce teklif kalemi ekleyiniz.', 'error');
          return;
        }

        recordQuoteInDatabase();

        const db = getDB();
        const formulas = db.pricing_formulas || DEFAULT_DB.pricing_formulas;
        const discountRate = (formulas.b2b_discount_percent ?? 15) / 100;
        const vatRate = (formulas.vat_percent ?? 20) / 100;

        let subtotal = 0;
        state.cart.forEach(item => {
          subtotal += item.qty * item.unitPrice;
        });
        const discount = subtotal * discountRate;
        const net = subtotal - discount;
        const vat = net * vatRate;
        const generalTotal = net + vat;

        const formatWAPrice = val => {
          if (state.currency === 'USD') {
            return '$ ' + (val / state.usdRate).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          } else if (state.currency === 'EUR') {
            return '€ ' + (val / state.eurRate).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          }
          return '₺ ' + val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        };

        let msg = `*DESAN KONVEYÖR SANAYİ VE DIŞ TİC. LTD. ŞTİ. - RESMİ B2B TEKLİF TALEBİ*\n`;
        msg += `----------------------------------------\n`;
        msg += `*Firma:* Ods Madencilik ve Lojistik A.Ş.\n`;
        msg += `*Yetkili:* Ahmet Yılmaz (Satınalma Md.)\n`;
        msg += `*Tarih:* ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}\n`;
        msg += `----------------------------------------\n`;
        msg += `*TALEP EDİLEN KALEMLER (${state.cart.length} Kalem):*\n\n`;

        state.cart.forEach((item, idx) => {
          const rowTotal = item.qty * item.unitPrice;
          msg += `${idx + 1}. *${item.title}*\n`;
          if (item.desc) msg += `   Detay: ${item.desc}\n`;
          msg += `   Miktar: ${item.qty} ${item.unit}\n`;
          msg += `   Birim Fiyat: ${formatWAPrice(item.unitPrice)} | Tutar: ${formatWAPrice(rowTotal)}\n\n`;
        });

        msg += `----------------------------------------\n`;
        msg += `*Ara Toplam:* ${formatWAPrice(subtotal)}\n`;
        msg += `*B2B İskonto (%${formulas.b2b_discount_percent ?? 15}):* -${formatWAPrice(discount)}\n`;
        msg += `*Net Tutar:* ${formatWAPrice(net)}\n`;
        msg += `*KDV (%${formulas.vat_percent ?? 20}):* ${formatWAPrice(vat)}\n`;
        msg += `*GENEL TOPLAM:* ${formatWAPrice(generalTotal)}\n`;
        msg += `----------------------------------------\n`;
        msg += `Bu teklif talebimizin onaylanarak tarafımıza resmi proforma faturası ve teslimat süresi bildirilmesini rica ederiz.`;

        const waUrl = `https://wa.me/905327075281?text=${encodeURIComponent(msg)}`;
        window.open(waUrl, '_blank');
        showToast('Resmi teklif WhatsApp hattına aktarıldı & Yönetim RFQ Masasına işlendi.', 'success');
        return;
      }

      const checkoutBtn = e.target.closest('#btn-checkout');
      if (checkoutBtn) {
        if (state.cart.length === 0) {
          showToast('Sepetiniz boş. Lütfen önce ürün ekleyiniz.', 'error');
          return;
        }
        recordQuoteInDatabase();
        showToast('Resmi Teklif ve Satın Alma Talebiniz Alındı! Yönetim RFQ Masasına aktarıldı.', 'success');
        return;
      }

      const addCatalogBtn = e.target.closest('[data-add-catalog]');
      if (addCatalogBtn) {
        const title = addCatalogBtn.getAttribute('data-title');
        const price = parseFloat(addCatalogBtn.getAttribute('data-price')) || 1000;
        const desc = addCatalogBtn.getAttribute('data-desc') || 'Standart konveyör parçası';

        state.cart.push({
          id: 'c_' + Date.now(),
          title: title,
          desc: desc,
          qty: 1,
          unit: 'ad',
          unitPrice: price,
          image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_Ktx4OFsRmW-hNuz3khP8M5BfXI_tPKqs3V4uA4KJteGJ0LY4CFPh8SwSse8-slw5qgG-2GJVKWIVANMgvUvYv0VnjQ5DmXnJDFlwnOIRjVS9OaytYxsACV12yNyHOQ0kwkQD0TJvpvCFHF1SzFk6lN7FyCksZyQQZLlhMDfdO2I7r-j7nhlU1FJ61jIZ33Erz_jwyui8FzjHAxulJC2J5-UDX5Kw4tMm3lxYpF4S4jNFQRupoVcv'
        });

        renderCart();
        showToast(`${title} teklif sepetine eklendi!`);
        return;
      }

      const tryBtn = e.target.closest('#btn-curr-try, #btn-curr-tl, #btn-curr-tl-mobile');
      const usdBtn = e.target.closest('#btn-curr-usd, #btn-curr-usd-mobile');
      const eurBtn = e.target.closest('#btn-curr-eur, #btn-curr-eur-mobile');
      if (tryBtn || usdBtn || eurBtn) {
        if (tryBtn) state.currency = 'TL';
        else if (usdBtn) state.currency = 'USD';
        else if (eurBtn) state.currency = 'EUR';

        const activeClassDesktop = 'px-2.5 py-0.5 bg-[#0284c7] text-white font-bold tracking-wider cursor-pointer active:scale-95 transition-all';
        const passiveClassDesktop = 'px-2.5 py-0.5 text-slate-600 hover:bg-slate-100 transition-all font-medium cursor-pointer active:scale-95';
        const activeClassMobile = 'px-3 py-1 bg-[#0284c7] text-white font-bold tracking-wider cursor-pointer active:scale-95 transition-all';
        const passiveClassMobile = 'px-3 py-1 text-slate-600 hover:bg-slate-100 font-medium cursor-pointer active:scale-95 transition-all';

        const updateBtnGroup = (currName, selectors) => {
          const els = document.querySelectorAll(selectors);
          els.forEach(el => {
            const isMobile = el.id.includes('mobile');
            if (state.currency === currName) {
              el.className = isMobile ? activeClassMobile : activeClassDesktop;
            } else {
              el.className = isMobile ? passiveClassMobile : passiveClassDesktop;
            }
          });
        };

        updateBtnGroup('TL', '#btn-curr-try, #btn-curr-tl, #btn-curr-tl-mobile');
        updateBtnGroup('USD', '#btn-curr-usd, #btn-curr-usd-mobile');
        updateBtnGroup('EUR', '#btn-curr-eur, #btn-curr-eur-mobile');

        renderCart();
        initHomeCalculator();
        initBantCalculator();
        initRuloCalculator();
        renderCatalogProducts();
      }
    });
  }

  // ==========================================
  // 6. SAHA SERVİS FORM ENTEGRASYONU
  // ==========================================
  function initServiceForm() {
    const serviceView = document.getElementById('view-atolye');
    if (!serviceView) return;

    const form = serviceView.querySelector('form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const inputs = form.querySelectorAll('input, select');
      const companyVal = inputs[0]?.value || 'Belirtilmedi';
      const contactVal = inputs[1]?.value || 'Belirtilmedi';
      const districtVal = inputs[2]?.options[inputs[2]?.selectedIndex]?.text || 'İstanbul İçi OSB';
      const hatVal = inputs[3]?.options[inputs[3]?.selectedIndex]?.text || 'Bantlı Konveyör';
      const serviceTypeVal = inputs[4]?.options[inputs[4]?.selectedIndex]?.text || 'Sıcak Pres / Vulkanizasyon';

      const db = getDB();
      const appointments = db.service_appointments || [];
      const newSrvId = 'SRV-' + String(appointments.length + 101);
      const dateStr = new Date().toISOString().substring(0, 10);

      const newApp = {
        id: newSrvId,
        company: `${companyVal} (${contactVal})`,
        district: districtVal,
        service_type: serviceTypeVal,
        target_date: dateStr,
        status: 'İncelemede',
        notes: `Hat Tipi: ${hatVal}`
      };

      if (!db.service_appointments) db.service_appointments = [];
      db.service_appointments.unshift(newApp);
      saveDB(db);

      form.reset();
      showToast('Planlı Servis Randevusu Talebiniz Alındı! Yönetim Saha Servis Modülüne işlendi.', 'success');
    });
  }

  // ==========================================
  // 6.5. İLETİŞİM FORM ENTEGRASYONU
  // ==========================================
  function initContactForm() {
    const contactView = document.getElementById('view-iletisim');
    if (!contactView) return;

    const form = contactView.querySelector('form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      form.reset();
      showToast('İletişim talebiniz ve mesajınız başarıyla alındı. Müşteri temsilcimiz kısa süre içinde sizinle iletişime geçecektir.', 'success');
    });
  }

  // ==========================================
  // 7. KATALOG ÜRÜNLERİ & STOK SENKRONİZASYONU
  // ==========================================
  function renderCatalogProducts() {
    const db = getDB();
    const products = db.products_stock || [];
    const rulmanPage = document.getElementById('view-rulman');
    if (!rulmanPage) return;

    const cards = rulmanPage.querySelectorAll('article');
    cards.forEach(card => {
      const titleEl = card.querySelector('h2');
      const addBtn = card.querySelector('[data-add-catalog]');
      const badgeEl = card.querySelector('.absolute.top-3.left-3');
      const priceEl = card.querySelector('.font-bold.text-[#0F172A].font-mono');

      if (!titleEl) return;
      const titleText = titleEl.textContent.trim();

      const prod = products.find(p => p.name.toLowerCase().includes(titleText.toLowerCase()) || titleText.toLowerCase().includes(p.name.toLowerCase()));
      if (prod) {
        if (addBtn) addBtn.setAttribute('data-price', prod.unit_price);
        if (priceEl) priceEl.innerHTML = `${formatMoney(prod.unit_price)} <span class="text-[11px] font-normal text-slate-500">/adet</span>`;

        if (badgeEl) {
          if (prod.stock_status === 'in_stock') {
            badgeEl.className = 'absolute top-3 left-3 bg-emerald-50 text-emerald-700 font-mono text-[11px] font-semibold px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1';
            badgeEl.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Stokta Var`;
          } else {
            badgeEl.className = 'absolute top-3 left-3 bg-amber-50 text-amber-700 font-mono text-[11px] font-semibold px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1';
            badgeEl.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Sipariş Üzerine`;
          }
        }
      }
    });
  }

  // CROSS-TAB REACTIVITY LISTENER
  function initMasterSyncListener() {
    window.addEventListener('desan:master_sync', () => {
      updateStateRates();
      renderCart();
      initHomeCalculator();
      initBantCalculator();
      initRuloCalculator();
      renderCatalogProducts();
    });
    window.addEventListener('storage', (e) => {
      if (e.key === MASTER_KEY || e.key === 'desan_db' || e.key === 'desan_rates') {
        updateStateRates();
        renderCart();
        initHomeCalculator();
        initBantCalculator();
        initRuloCalculator();
        renderCatalogProducts();
      }
    });
  }

  // ==========================================
  // BANT TEKNİK ŞARTNAME & PDF İNDİRME MOTORU
  // ==========================================
  window.downloadBantTechnicalSpecPDF = async function(btnElement) {
    const btn = btnElement || document.getElementById('btn-download-bant-spec');
    if (!window.html2pdf) {
      alert('PDF motoru hazır değil.');
      return;
    }

    const originalHtml = btn ? btn.innerHTML : '';
    if (btn) {
      btn.innerHTML = '<span>⏳ İndiriliyor...</span>';
      btn.disabled = true;
    }

    // 1. FİYATI GÜVENLİ VE DOĞRU OKU (addTeklife Ekle hatasını engeller)
    let accuratePrice = '₺ 53.087,50';
    const allElements = document.querySelectorAll('span, div, p, strong');
    for (const el of allElements) {
      const txt = el.innerText ? el.innerText.trim() : '';
      // Buton metinlerini hariç tut, sadece içinde ₺ veya TL geçen ve sayı içeren en spesifik metni al
      if (txt.includes('₺') && /\d/.test(txt) && !txt.toLowerCase().includes('ekle') && txt.length < 25) {
        accuratePrice = txt;
      }
    }

    // 2. FORM PARAMETRELERİNİ OKU
    const techCode = document.querySelector('[data-cad-code], #cad-tech-code')?.innerText.trim() || 'DSN-BELT-SPEC-2026';
    const beltType = document.querySelector('input[name="belt-type"]:checked')?.parentElement?.innerText?.trim() || 'Kauçuk EP Serisi';
    const epVal = document.getElementById('select-belt-ep')?.value || 'EP 400/3 (Ağır Hizmet - Maden/Kırma)';
    const coverVal = document.getElementById('select-belt-cover')?.value || '4+2 mm';
    const widthVal = (document.getElementById('input-belt-width')?.value || '650') + ' mm';
    const lengthVal = (document.getElementById('input-belt-length')?.value || '12500') + ' mm (12.50 Metre)';
    const jointVal = document.querySelector('input[name="belt-joint"]:checked')?.parentElement?.innerText?.trim() || 'Sıcak Pres (Vulkanizasyon)';

    // 3. CANLI CAD KUTUSUNUN EKRAN GÖRÜNTÜSÜNÜ AL
    const liveCadBox = document.querySelector('#cad-preview-container, .cad-preview, #belt-cad-canvas') || document.querySelector('svg')?.parentElement;
    let cadImageTag = '<div style="padding:30px; text-align:center; color:#64748b;">2D Çizim Önizlemesi</div>';
    
    if (liveCadBox && (window.html2canvas || window.html2pdf().worker?.opt?.html2canvas)) {
      try {
        const snapFn = window.html2canvas || window.html2pdf().worker.opt.html2canvas;
        const cadCanvas = await snapFn(liveCadBox, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        const cadDataUrl = cadCanvas.toDataURL('image/png');
        cadImageTag = `<img src="${cadDataUrl}" style="max-width: 100%; max-height: 180px; height: auto; display: block; margin: 0 auto; object-fit: contain;" />`;
      } catch(e) {
        console.warn('CAD anlık görüntü alınamadı:', e);
      }
    }

    // 4. OVERLAY OLUŞTUR (GÜVENLİ VE MANUEL KAPATMA [X] BUTONLU)
    const overlayId = 'tech-pdf-render-overlay-' + Date.now();
    const overlay = document.createElement('div');
    overlay.id = overlayId;
    overlay.style.cssText = 'position: fixed; inset: 0; background: rgba(15, 23, 42, 0.85); z-index: 99999; display: flex; align-items: flex-start; justify-content: center; padding: 20px; box-sizing: border-box; overflow-y: auto;';

    overlay.innerHTML = `
      <div style="position: relative; width: 794px; min-width: 794px; max-width: 794px; background: #ffffff; color: #0f172a; padding: 35px 40px; box-sizing: border-box; font-family: Arial, Helvetica, sans-serif; font-size: 12px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
        
        <!-- Antet -->
        <div style="display: table; width: 100%; border-bottom: 2px solid #0284c7; padding-bottom: 15px; margin-bottom: 20px;">
          <div style="display: table-cell; vertical-align: top; width: 65%;">
            <div style="font-size: 22px; font-weight: 900; color: #0284c7;">DESAN KONVEYÖR</div>
            <div style="font-size: 11px; font-weight: bold; color: #475569; margin-top: 2px;">DESAN KONVEYÖR SANAYİ VE DIŞ TİC. LTD. ŞTİ.</div>
            <div style="font-size: 12px; font-weight: bold; color: #0f172a; margin-top: 3px;">KONVEYÖR BANT TEKNİK İMALAT ŞARTNAMESİ</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">İkitelli Organize San. Böl. Atatürk Oto San. Sitesi 19. Sokak No:545 Başakşehir / İSTANBUL</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 1px;">İkitelli V.D.: 2931175671 | Tel: +90 (212) 486 26 63 | info@desanmakina.net</div>
          </div>
          <div style="display: table-cell; vertical-align: top; width: 35%; text-align: right;">
            <span style="background: #0f172a; color: #ffffff; padding: 4px 8px; font-size: 10px; font-weight: bold; border-radius: 3px;">MÜHENDİSLİK ÇIKTISI</span>
            <div style="font-family: monospace; font-size: 11px; font-weight: bold; color: #0284c7; margin-top: 6px;">${techCode}</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Tarih: ${new Date().toLocaleDateString('tr-TR')}</div>
          </div>
        </div>

        <!-- 2D Çizim -->
        <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; background: #f8fafc; margin-bottom: 20px;">
          <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">2D Şematik Konveyör Bant Kesiti ve Açılımı:</div>
          <div style="background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 4px; padding: 8px; text-align: center; min-height: 180px; display: flex; align-items: center; justify-content: center;">
            ${cadImageTag}
          </div>
        </div>

        <!-- Tablo -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 22px;">
          <thead>
            <tr style="background: #0f172a; color: #ffffff;">
              <th style="padding: 8px 12px; text-align: left; font-size: 11px; width: 40%; font-weight: bold;">TEKNİK PARAMETRE</th>
              <th style="padding: 8px 12px; text-align: left; font-size: 11px; width: 60%; font-weight: bold;">DEĞER / SEÇİM</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #ffffff;"><td style="padding: 7px 12px; color: #475569; font-weight: 600;">Bant Tipi / Malzeme</td><td style="padding: 7px 12px; color: #0f172a; font-weight: bold;">${beltType}</td></tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;"><td style="padding: 7px 12px; color: #475569; font-weight: 600;">Çekme Mukavemeti (Kord)</td><td style="padding: 7px 12px; color: #0f172a; font-weight: bold;">${epVal}</td></tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #ffffff;"><td style="padding: 7px 12px; color: #475569; font-weight: 600;">Kaplama Kalınlığı (Üst + Alt)</td><td style="padding: 7px 12px; color: #0f172a; font-weight: bold;">${coverVal}</td></tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;"><td style="padding: 7px 12px; color: #475569; font-weight: 600;">Bant Genişliği (W)</td><td style="padding: 7px 12px; color: #0f172a; font-weight: bold;">${widthVal}</td></tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #ffffff;"><td style="padding: 7px 12px; color: #475569; font-weight: 600;">Toplam Hat Boyu (L)</td><td style="padding: 7px 12px; color: #0f172a; font-weight: bold;">${lengthVal}</td></tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;"><td style="padding: 7px 12px; color: #475569; font-weight: 600;">Birleştirme & Ek Yöntemi</td><td style="padding: 7px 12px; color: #0f172a; font-weight: bold;">${jointVal}</td></tr>
          </tbody>
        </table>

        <!-- Sevk ve Fiyat -->
        <div style="display: table; width: 100%; background: #f1f5f9; border-radius: 6px; padding: 12px; margin-bottom: 25px; box-sizing: border-box;">
          <div style="display: table-cell; vertical-align: middle; width: 55%;">
            <div style="font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase;">İmalat ve Sevk Durumu:</div>
            <div style="font-size: 12px; font-weight: bold; color: #0f172a; margin-top: 2px;">24-48 Saat İkitelli Atölye / Ambar Sevk</div>
          </div>
          <div style="display: table-cell; vertical-align: middle; width: 45%; text-align: right;">
            <div style="font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase;">Birim & Toplam Bedel (KDV Hariç):</div>
            <div style="font-size: 16px; font-weight: 900; color: #0284c7; margin-top: 2px; font-family: monospace;">${accuratePrice}</div>
          </div>
        </div>

        <!-- Mühür ve İmza -->
        <div style="display: table; width: 100%; border-top: 1px solid #cbd5e1; padding-top: 15px;">
          <div style="display: table-cell; vertical-align: bottom; width: 70%;">
            <div style="font-size: 9px; color: #64748b;">Bu şartname Desan Makina imalat hattı doğrulaması için üretilmiştir.</div>
            <div style="font-size: 9px; color: #64748b; margin-top: 2px;">Tüm ölçüler milimetrik (mm) hassasiyettedir.</div>
          </div>
          <div style="display: table-cell; vertical-align: bottom; width: 30%; text-align: center;">
            <div style="width: 80px; height: 80px; border: 2px solid #0284c7; border-radius: 50%; margin: 0 auto; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #0284c7; font-weight: bold; transform: rotate(-5deg);">
              <div style="font-size: 7px;">DESAN MAKİNA</div>
              <div style="font-size: 6px; border-top: 1px solid #0284c7; border-bottom: 1px solid #0284c7; margin: 2px 0;">TEKNİK ONAY</div>
              <div style="font-size: 7px;">İKİTELLİ</div>
            </div>
            <div style="font-size: 9px; font-weight: bold; color: #0f172a; margin-top: 4px;">Teknik Ofis İmzası</div>
          </div>
        </div>

      </div>
    `;

    document.body.appendChild(overlay);

    // Kapatma Fonksiyonu (Hem otomatik hem buton için garantili)
    const removeOverlaySafe = () => {
      const el = document.getElementById(overlayId);
      if (el) el.remove();
      if (btn) {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
      }
    };

    // Emniyet Zamanlayıcısı: 4 saniye sonra her halükarda perdeyi kaldırır
    const forceTimer = setTimeout(removeOverlaySafe, 4000);

    try {
      await new Promise(r => setTimeout(r, 250));
      const targetContent = overlay.firstElementChild;

      const opt = {
        margin: 0,
        filename: `Desan_Teknik_Sartname_${techCode.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, scrollY: 0, scrollX: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await window.html2pdf().set(opt).from(targetContent).save();
    } catch (err) {
      console.error('PDF Üretim Hatası:', err);
      alert('Teknik şartname oluşturulurken hata oluştu.');
    } finally {
      clearTimeout(forceTimer);
      removeOverlaySafe();
    }
  };

  // ==========================================
  // RULO & TAMBUR TEKNİK ŞARTNAME PDF MOTORU
  // ==========================================
  async function generateMechanicalSpecPDF(config = {}, btnElement) {
    const isTambur = config.type === 'tambur' || document.getElementById('tab-tambur')?.classList.contains('bg-[#0284C7]') || document.getElementById('summary-d')?.innerText.includes('219');
    const defaultBtnId = isTambur ? 'btn-download-tambur-spec' : 'btn-download-rulo-spec';
    const btn = btnElement || document.getElementById(defaultBtnId) || document.getElementById('btn-download-rulo-spec');
    
    if (!window.html2pdf) {
      alert('PDF motoru hazır değil. Lütfen sayfayı yenileyin.');
      return;
    }

    const originalHtml = btn ? btn.innerHTML : '';
    if (btn) {
      btn.innerHTML = '<span>⏳ İndiriliyor...</span>';
      btn.disabled = true;
    }

    // 1. FİYATI DOĞRU OKU
    let accuratePrice = document.getElementById('price-total')?.innerText.trim() || '₺ 685,00';

    // 2. FORM PARAMETRELERİNİ OKU
    const docTitle = isTambur ? 'KONVEYÖR TAHRİK & GERGİ TAMBURU TEKNİK İMALAT ŞARTNAMESİ' : 'KONVEYÖR TAŞIYICI RULO TEKNİK İMALAT ŞARTNAMESİ';
    const productGroup = isTambur ? 'Tahrik / Gergi Tamburu (DIN 22107)' : 'Taşıyıcı Ağır Sanayi Rulosu (DIN 22107)';
    const techCode = document.getElementById('sku-badge')?.innerText.trim() || (isTambur ? 'DSN-TMB-SPEC-2026' : 'DSN-ROL-SPEC-2026');
    const borucapi = document.getElementById('summary-d')?.innerText.trim() || '-';
    const milcapi = document.getElementById('summary-mil')?.innerText.trim() || '-';
    const boruboyu = document.getElementById('summary-l')?.innerText.trim() || '-';
    const milboyu = document.getElementById('summary-a')?.innerText.trim() || '-';
    const milucu = document.getElementById('summary-mil-ucu')?.innerText.trim() || '-';
    const kaplama = document.getElementById('summary-kaplama')?.innerText.trim() || '-';
    const qtyVal = (document.getElementById('input-qty')?.value || '1') + ' Adet';

    // 3. CANLI CAD KUTUSUNUN EKRAN GÖRÜNTÜSÜNÜ AL
    const liveCadBox = document.querySelector('svg')?.parentElement || document.querySelector('.relative.w-full.bg-slate-50\\/90');
    let cadImageTag = '<div style="padding:30px; text-align:center; color:#64748b;">2D Çizim Önizlemesi</div>';
    
    if (liveCadBox && (window.html2canvas || window.html2pdf().worker?.opt?.html2canvas)) {
      try {
        const snapFn = window.html2canvas || window.html2pdf().worker.opt.html2canvas;
        const cadCanvas = await snapFn(liveCadBox, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        const cadDataUrl = cadCanvas.toDataURL('image/png');
        cadImageTag = `<img src="${cadDataUrl}" style="max-width: 100%; max-height: 180px; height: auto; display: block; margin: 0 auto; object-fit: contain;" />`;
      } catch(e) {
        console.warn('CAD anlık görüntü alınamadı:', e);
      }
    }

    // 4. OVERLAY OLUŞTUR
    const overlayId = 'mech-pdf-render-overlay-' + Date.now();
    const overlay = document.createElement('div');
    overlay.id = overlayId;
    overlay.style.cssText = 'position: fixed; inset: 0; background: rgba(15, 23, 42, 0.85); z-index: 99999; display: flex; align-items: flex-start; justify-content: center; padding: 20px; box-sizing: border-box; overflow-y: auto;';

    overlay.innerHTML = `
      <div style="position: relative; width: 794px; min-width: 794px; max-width: 794px; background: #ffffff; color: #0f172a; padding: 35px 40px; box-sizing: border-box; font-family: Arial, Helvetica, sans-serif; font-size: 12px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
        
        <!-- Antet -->
        <div style="display: table; width: 100%; border-bottom: 2px solid #0284c7; padding-bottom: 15px; margin-bottom: 20px;">
          <div style="display: table-cell; vertical-align: top; width: 65%;">
            <div style="font-size: 22px; font-weight: 900; color: #0284c7;">DESAN KONVEYÖR</div>
            <div style="font-size: 11px; font-weight: bold; color: #475569; margin-top: 2px;">DESAN KONVEYÖR SANAYİ VE DIŞ TİC. LTD. ŞTİ.</div>
            <div style="font-size: 12px; font-weight: bold; color: #0f172a; margin-top: 3px;">${docTitle}</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">İkitelli Organize San. Böl. Atatürk Oto San. Sitesi 19. Sokak No:545 Başakşehir / İSTANBUL</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 1px;">İkitelli V.D.: 2931175671 | Tel: +90 (212) 486 26 63 | info@desanmakina.net</div>
          </div>
          <div style="display: table-cell; vertical-align: top; width: 35%; text-align: right;">
            <span style="background: #0f172a; color: #ffffff; padding: 4px 8px; font-size: 10px; font-weight: bold; border-radius: 3px;">MEKANİK İMALAT ÇIKTISI</span>
            <div style="font-family: monospace; font-size: 11px; font-weight: bold; color: #0284c7; margin-top: 6px;">${techCode}</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Tarih: ${new Date().toLocaleDateString('tr-TR')}</div>
          </div>
        </div>

        <!-- 2D Çizim -->
        <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; background: #f8fafc; margin-bottom: 20px;">
          <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">2D Canlı CAD Teknik Çizimi ve Tolerans Şeması:</div>
          <div style="background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 4px; padding: 8px; text-align: center; min-height: 180px; display: flex; align-items: center; justify-content: center;">
            ${cadImageTag}
          </div>
        </div>

        <!-- Tablo -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 22px;">
          <thead>
            <tr style="background: #0f172a; color: #ffffff;">
              <th style="padding: 8px 12px; text-align: left; font-size: 11px; width: 40%; font-weight: bold;">TEKNİK PARAMETRE</th>
              <th style="padding: 8px 12px; text-align: left; font-size: 11px; width: 60%; font-weight: bold;">DEĞER / SEÇİM</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #ffffff;"><td style="padding: 7px 12px; color: #475569; font-weight: 600;">Ürün Grubu & Standart</td><td style="padding: 7px 12px; color: #0f172a; font-weight: bold;">${productGroup}</td></tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;"><td style="padding: 7px 12px; color: #475569; font-weight: 600;">Boru Çapı & Kalınlığı (D)</td><td style="padding: 7px 12px; color: #0f172a; font-weight: bold;">${borucapi}</td></tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #ffffff;"><td style="padding: 7px 12px; color: #475569; font-weight: 600;">Mil Çapı & Rulman Tipi</td><td style="padding: 7px 12px; color: #0f172a; font-weight: bold;">${milcapi}</td></tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;"><td style="padding: 7px 12px; color: #475569; font-weight: 600;">Boru Boyu (L)</td><td style="padding: 7px 12px; color: #0284c7; font-weight: bold;">${boruboyu}</td></tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #ffffff;"><td style="padding: 7px 12px; color: #475569; font-weight: 600;">Mil Boyu (A)</td><td style="padding: 7px 12px; color: #0284c7; font-weight: bold;">${milboyu}</td></tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;"><td style="padding: 7px 12px; color: #475569; font-weight: 600;">Mil Ucu İşleme Tipi</td><td style="padding: 7px 12px; color: #0f172a; font-weight: bold;">${milucu}</td></tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #ffffff;"><td style="padding: 7px 12px; color: #475569; font-weight: 600;">Boru Yüzeyi / Kaplama</td><td style="padding: 7px 12px; color: #0f172a; font-weight: bold;">${kaplama}</td></tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background: #f8fafc;"><td style="padding: 7px 12px; color: #475569; font-weight: 600;">Sipariş Miktarı</td><td style="padding: 7px 12px; color: #0f172a; font-weight: bold;">${qtyVal}</td></tr>
          </tbody>
        </table>

        <!-- Sevk ve Fiyat -->
        <div style="display: table; width: 100%; background: #f1f5f9; border-radius: 6px; padding: 12px; margin-bottom: 25px; box-sizing: border-box;">
          <div style="display: table-cell; vertical-align: middle; width: 55%;">
            <div style="font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase;">İmalat ve Sevk Durumu:</div>
            <div style="font-size: 12px; font-weight: bold; color: #0f172a; margin-top: 2px;">İkitelli Atölye Üretimi / TSE & DIN Standartlarında</div>
          </div>
          <div style="display: table-cell; vertical-align: middle; width: 45%; text-align: right;">
            <div style="font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase;">Toplam Bedel (KDV Hariç):</div>
            <div style="font-size: 16px; font-weight: 900; color: #0284c7; margin-top: 2px; font-family: monospace;">${accuratePrice}</div>
          </div>
        </div>

        <!-- Mühür ve İmza -->
        <div style="display: table; width: 100%; border-top: 1px solid #cbd5e1; padding-top: 15px;">
          <div style="display: table-cell; vertical-align: bottom; width: 70%;">
            <div style="font-size: 9px; color: #64748b;">Bu teknik şartname Desan Makina imalat hattı doğrulaması için üretilmiştir.</div>
            <div style="font-size: 9px; color: #64748b; margin-top: 2px;">DIN 22107 standartlarına uygun balans ve tolerans kontrolü yapılmıştır.</div>
          </div>
          <div style="display: table-cell; vertical-align: bottom; width: 30%; text-align: center;">
            <div style="width: 80px; height: 80px; border: 2px solid #0284c7; border-radius: 50%; margin: 0 auto; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #0284c7; font-weight: bold; transform: rotate(-5deg);">
              <div style="font-size: 7px;">DESAN MAKİNA</div>
              <div style="font-size: 6px; border-top: 1px solid #0284c7; border-bottom: 1px solid #0284c7; margin: 2px 0;">TEKNİK ONAY</div>
              <div style="font-size: 7px;">İKİTELLİ</div>
            </div>
            <div style="font-size: 9px; font-weight: bold; color: #0f172a; margin-top: 4px;">Teknik Ofis İmzası</div>
          </div>
        </div>

      </div>
    `;

    document.body.appendChild(overlay);

    const removeOverlaySafe = () => {
      const el = document.getElementById(overlayId);
      if (el) el.remove();
      if (btn) {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
      }
    };

    const forceTimer = setTimeout(removeOverlaySafe, 4000);

    try {
      await new Promise(r => setTimeout(r, 250));
      const targetContent = overlay.firstElementChild;

      const opt = {
        margin: 0,
        filename: `Desan_Mekanik_Sartname_${techCode.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, scrollY: 0, scrollX: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await window.html2pdf().set(opt).from(targetContent).save();
    } catch (err) {
      console.error('PDF Üretim Hatası:', err);
      alert('Mekanik şartname oluşturulurken hata oluştu.');
    } finally {
      clearTimeout(forceTimer);
      removeOverlaySafe();
    }
  }

  window.downloadRuloTechnicalSpecPDF = function(btnElement) {
    return generateMechanicalSpecPDF({ type: 'rulo' }, btnElement);
  };

  window.downloadTamburTechnicalSpecPDF = function(btnElement) {
    return generateMechanicalSpecPDF({ type: 'tambur' }, btnElement);
  };

  document.addEventListener('click', (e) => {
    const bantBtn = e.target.closest('#btn-download-bant-spec');
    if (bantBtn) {
      e.preventDefault();
      window.downloadBantTechnicalSpecPDF(bantBtn);
    }
    const ruloBtn = e.target.closest('#btn-download-rulo-spec');
    if (ruloBtn) {
      e.preventDefault();
      window.downloadRuloTechnicalSpecPDF(ruloBtn);
    }
    const tamburBtn = e.target.closest('#btn-download-tambur-spec');
    if (tamburBtn) {
      e.preventDefault();
      window.downloadTamburTechnicalSpecPDF(tamburBtn);
    }
  });

  // INITIALIZATION ON DOM READY
  document.addEventListener('DOMContentLoaded', () => {
    initCurrencyEngine();
    initRouter();
    initMobileMenu();
    initHomeCalculator();
    initBantCalculator();
    initRuloCalculator();
    initCartEvents();
    initCariAuthModal();
    initServiceForm();
    initContactForm();
    renderCatalogProducts();
    initMasterSyncListener();
    renderCart();
  });

})();
