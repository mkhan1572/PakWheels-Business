/* ══════════════════════════════════════════════════════════
   PakWheels Business Portal  ·  main.js
   Full client-side logic: Dashboard, Listings, Detail,
   Admin Console (CRUD), Vehicle Comparison
   ══════════════════════════════════════════════════════════ */

const sitePlaceholder = 'https://via.placeholder.com/800x520?text=Image+not+available';
const apiBase = '/api';

/* ── Utilities ───────────────────────────────────────────── */
function safeImage(url) {
  return (url && url.trim() !== '') ? url : sitePlaceholder;
}

function formatPrice(value, currency = 'PKR') {
  if (value === null || value === undefined || value === '') return 'N/A';
  const amount = Number(value);
  if (Number.isNaN(amount)) return 'N/A';
  return `${amount.toLocaleString('en-US')} ${currency ? currency.toUpperCase() : ''}`.trim();
}

function formatMileage(value) {
  if (value === null || value === undefined || value === '') return 'N/A';
  const amount = Number(value);
  if (Number.isNaN(amount)) return 'N/A';
  return `${amount.toLocaleString('en-US')} km`;
}

function formatMarketValue(value) {
  if (!value) return 'N/A';
  const n = Number(value);
  if (n >= 1e12) return `PKR ${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `PKR ${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `PKR ${(n / 1e6).toFixed(1)}M`;
  return `PKR ${n.toLocaleString('en-US')}`;
}

async function fetchJson(path) {
  try {
    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    return await res.json();
  } catch (e) {
    return { error: e.message };
  }
}

async function postJson(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return { status: res.status, data: await res.json() };
}

async function putJson(path, body) {
  const res = await fetch(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return { status: res.status, data: await res.json() };
}

async function deleteJson(path) {
  const res = await fetch(path, { method: 'DELETE' });
  return { status: res.status, data: await res.json() };
}

function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      search.set(k, String(v));
    }
  });
  const q = search.toString();
  return q ? `?${q}` : '';
}

function setPageTitle(title) {
  document.title = title ? `${title} · PakWheels Business` : 'PakWheels Business Portal';
}

/* ── Toast notification ──────────────────────────────────── */
function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast-notify');
  if (existing) existing.remove();
  const icon = type === 'success'
    ? '<i class="fa-solid fa-circle-check"></i>'
    : '<i class="fa-solid fa-circle-xmark"></i>';
  const toast = document.createElement('div');
  toast.className = `toast-notify ${type}`;
  toast.innerHTML = `${icon} ${message}`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* ════════════════════════════════════════════════════════════
   DASHBOARD
   ════════════════════════════════════════════════════════════ */
async function loadDashboard() {
  setPageTitle('Dashboard');

  const [overview, trends] = await Promise.all([
    fetchJson(`${apiBase}/analytics/overview`),
    fetchJson(`${apiBase}/analytics/trends`)
  ]);

  /* KPI cards */
  if (!overview || overview.error) {
    ['statTotalListings','statAvgPrice','statAvgMileage','statModelCount','statMarketValue','statCities']
      .forEach(id => { const el = document.getElementById(id); if (el) el.textContent = 'N/A'; });
  } else {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('statTotalListings', (overview.total_listings || 0).toLocaleString('en-US'));
    set('statAvgPrice',      formatPrice(Math.round(overview.avg_price || 0)));
    set('statAvgMileage',    `${Math.round(overview.avg_mileage || 0).toLocaleString('en-US')} km`);
    set('statModelCount',    (overview.total_models || 0).toLocaleString('en-US'));
    set('statMarketValue',   formatMarketValue(overview.total_market_value));
    set('statCities',        (overview.distinct_cities || 0).toLocaleString('en-US'));
  }

  /* Trend insights */
  if (trends && !trends.error) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    if (trends.auto_premium_pct !== undefined) {
      set('trendAutoPremium', `${trends.auto_premium_pct > 0 ? '+' : ''}${trends.auto_premium_pct}%`);
    }
    if (trends.dominant_make) {
      set('trendDomMake', trends.dominant_make.make);
      set('trendDomMakePct', `${trends.dominant_make.percentage}% market share`);
    }
    if (trends.high_pricing_city) {
      set('trendHighCity', trends.high_pricing_city.city);
      set('trendHighCityPrice', `Avg ${formatPrice(Math.round(trends.high_pricing_city.avg_price))}`);
    }
  }

  /* Charts */
  const topMakes = await fetchJson(`${apiBase}/analytics/top-makes?limit=8`);
  const topCities = await fetchJson(`${apiBase}/analytics/cities`);
  renderBarChart('chartTopMakes', topMakes, 'make_name', 'count', 'Listings');
  renderBarChart('chartTopCities', topCities?.slice(0, 8), 'city_name', 'total_listings', 'Listings');

  /* Featured listings */
  const featured = await fetchJson(`${apiBase}/listings?limit=6&page=1`);
  renderFeaturedListings(featured?.data || []);
}

/* Gradient bar chart renderer */
function renderBarChart(canvasId, items, labelKey, valueKey, label) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !Array.isArray(items)) return;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 260);
  grad.addColorStop(0, 'rgba(37, 99, 235, 0.90)');
  grad.addColorStop(1, 'rgba(37, 99, 235, 0.25)');
  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: items.map(i => i[labelKey]),
      datasets: [{
        label,
        data: items.map(i => Number(i[valueKey] || 0)),
        backgroundColor: grad,
        borderRadius: 6,
        maxBarThickness: 32
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          titleColor: '#94a3b8',
          bodyColor: '#fff',
          padding: 10,
          cornerRadius: 8
        }
      },
      scales: {
        x: {
          ticks: { color: '#64748b', font: { size: 11 } },
          grid: { display: false }
        },
        y: {
          ticks: { color: '#64748b', font: { size: 11 } },
          grid: { color: 'rgba(15,23,42,0.05)' }
        }
      }
    }
  });
}

function renderFeaturedListings(listings = []) {
  const container = document.getElementById('featuredListings');
  if (!container) return;
  if (!listings.length) {
    container.innerHTML = '<div class="col-12"><div class="panel-card p-4 text-center text-muted">No listings available at the moment.</div></div>';
    return;
  }
  container.innerHTML = listings.map(l => `
    <div class="col-md-6 col-xl-4">
      <a href="/listing/${l.listing_id}" class="text-decoration-none text-body">
        <article class="listing-card h-100">
          <img src="${safeImage(l.image_url)}" alt="${l.title || 'Vehicle'}" loading="lazy" />
          <div class="listing-card-body">
            <div class="d-flex justify-content-between align-items-start gap-2">
              <h3 class="listing-card-title">${l.make || 'Unknown'} ${l.model || ''}</h3>
              <span class="listing-card-badge">${l.year || '—'}</span>
            </div>
            <p class="listing-card-meta mb-1">${l.title || 'Vehicle listing'}</p>
            <p class="mb-0 fw-semibold text-primary">${formatPrice(l.price, l.price_currency)}</p>
            <p class="listing-card-meta">${l.city || 'Location'} · ${l.fuel || '—'} · ${l.transmission || '—'}</p>
          </div>
        </article>
      </a>
    </div>
  `).join('');
}

/* ════════════════════════════════════════════════════════════
   LISTINGS PAGE
   ════════════════════════════════════════════════════════════ */
async function loadListingsPage() {
  setPageTitle('Inventory');
  const params = new URLSearchParams(window.location.search);
  await populateSelects(params.get('make') || '');
  updateFormValuesFromQuery();
  await renderListingResults(Number(params.get('page')) || 1);
}

function updateFormValuesFromQuery() {
  const p = new URLSearchParams(window.location.search);
  ['search','make','model','city','fuel','transmission','body_type','sort'].forEach(key => {
    const el = document.getElementById(`filter${key.charAt(0).toUpperCase() + key.slice(1).replace('_t','T').replace('_s','S')}`);
    if (el) el.value = p.get(key) || (key === 'sort' ? 'recent' : '');
  });
  const search = document.getElementById('filterSearch');  if (search) search.value = p.get('search') || '';
  const sort   = document.getElementById('filterSort');    if (sort)   sort.value   = p.get('sort')   || 'recent';
  const bt     = document.getElementById('filterBodyType');if (bt)     bt.value     = p.get('body_type') || '';
}

async function populateSelects(selectedMake = '') {
  const [makes, cities, fuels, trans, bodies] = await Promise.all([
    fetchJson(`${apiBase}/filters/makes`),
    fetchJson(`${apiBase}/filters/cities`),
    fetchJson(`${apiBase}/filters/fuel-types`),
    fetchJson(`${apiBase}/filters/transmissions`),
    fetchJson(`${apiBase}/filters/body-types`)
  ]);
  fillSelect('filterMake', makes, 'All makes');
  fillSelect('filterCity', cities, 'All cities');
  fillSelect('filterFuel', fuels, 'Any fuel');
  fillSelect('filterTransmission', trans, 'Any transmission');
  fillSelect('filterBodyType', bodies, 'All body types');
  if (selectedMake) {
    document.getElementById('filterMake').value = selectedMake;
    await populateModels(selectedMake);
  } else {
    fillSelect('filterModel', [], 'All models');
  }
}

async function populateModels(make = '') {
  const models = make ? await fetchJson(`${apiBase}/filters/models?make=${encodeURIComponent(make)}`) : [];
  fillSelect('filterModel', models, 'All models');
}

function fillSelect(fieldId, items, defaultLabel) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  const selected = el.value || '';
  el.innerHTML = `<option value="">${defaultLabel}</option>` +
    (Array.isArray(items) ? items.map(v => {
      const s = String(v || '');
      return `<option value="${s}">${s}</option>`;
    }).join('') : '');
  if (selected) el.value = selected;
}

async function renderListingResults(page = 1) {
  const qp = new URLSearchParams(window.location.search);
  const params = {
    search:       qp.get('search')       || document.getElementById('filterSearch')?.value,
    make:         qp.get('make')         || document.getElementById('filterMake')?.value,
    model:        qp.get('model')        || document.getElementById('filterModel')?.value,
    city:         qp.get('city')         || document.getElementById('filterCity')?.value,
    fuel:         qp.get('fuel')         || document.getElementById('filterFuel')?.value,
    transmission: qp.get('transmission') || document.getElementById('filterTransmission')?.value,
    body_type:    qp.get('body_type')    || document.getElementById('filterBodyType')?.value,
    sort:         qp.get('sort')         || document.getElementById('filterSort')?.value,
    page, limit: 12
  };
  const result = await fetchJson(`${apiBase}/listings${buildQuery(params)}`);
  if (!result || result.error) {
    document.getElementById('resultCount').textContent = '0';
    document.getElementById('listingGrid').innerHTML = '<div class="col-12"><div class="panel-card p-4 text-center text-muted">Unable to load listings.</div></div>';
    document.getElementById('listingTable').innerHTML = '';
    document.getElementById('paginationControls').innerHTML = '';
    return;
  }
  window.history.replaceState({}, '', `/listings${buildQuery(params)}`);
  const listings = result.data || [];
  document.getElementById('resultCount').textContent = (result.total || listings.length).toLocaleString('en-US');
  renderListingGrid(listings);
  renderListingTable(listings);
  renderPagination(result.page || page, result.total || listings.length, params.limit);
}

function renderListingGrid(listings = []) {
  const el = document.getElementById('listingGrid');
  if (!el) return;
  if (!listings.length) {
    el.innerHTML = '<div class="col-12"><div class="panel-card p-4 text-center text-muted">No listings match these filters.</div></div>';
    return;
  }
  el.innerHTML = listings.map(item => `
    <div class="col-md-6">
      <a href="/listing/${item.listing_id}" class="text-decoration-none text-body">
        <article class="listing-card h-100">
          <img src="${safeImage(item.image_url)}" alt="${item.title || 'Vehicle'}" loading="lazy" />
          <div class="listing-card-body">
            <div class="d-flex justify-content-between align-items-start gap-2">
              <div>
                <h3 class="listing-card-title">${item.make || 'Unknown'} ${item.model || ''}</h3>
                <p class="listing-card-meta">${item.body_type || 'Vehicle'} · ${item.color || '—'}</p>
              </div>
              <span class="listing-card-badge">${formatPrice(item.price, item.price_currency)}</span>
            </div>
            <p class="listing-card-meta mb-1">${item.title || 'Vehicle listing'}</p>
            <p class="listing-card-meta">${formatMileage(item.mileage_km)} · ${item.city || '—'}</p>
          </div>
        </article>
      </a>
    </div>
  `).join('');
}

function renderListingTable(listings = []) {
  const tbody = document.getElementById('listingTable');
  if (!tbody) return;
  if (!listings.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No matching vehicles found.</td></tr>';
    return;
  }
  tbody.innerHTML = listings.map(item => `
    <tr>
      <td>
        <div class="d-flex align-items-center gap-3">
          <img src="${safeImage(item.image_url)}" alt="${item.title || ''}" class="table-avatar rounded-3" loading="lazy" />
          <div>
            <a href="/listing/${item.listing_id}" class="fw-semibold text-decoration-none">${item.make || 'Unknown'} ${item.model || ''}</a>
            <div class="text-muted small">${item.title || ''}</div>
          </div>
        </div>
      </td>
      <td class="fw-semibold">${formatPrice(item.price, item.price_currency)}</td>
      <td>${item.year || '—'}</td>
      <td>${formatMileage(item.mileage_km)}</td>
      <td>${item.fuel || '—'} / ${item.transmission || '—'}</td>
      <td>${item.city || '—'}</td>
    </tr>
  `).join('');
}

function renderPagination(currentPage = 1, totalCount = 0, pageSize = 12) {
  const pages = Math.ceil(totalCount / pageSize) || 1;
  const container = document.getElementById('paginationControls');
  if (!container) return;
  const range = [];
  const start = Math.max(1, currentPage - 2);
  const end   = Math.min(pages, currentPage + 2);
  if (start > 1) range.push(1);
  if (start > 2) range.push('...');
  for (let i = start; i <= end; i++) range.push(i);
  if (end < pages - 1) range.push('...');
  if (end < pages) range.push(pages);
  container.innerHTML = range.map(v => {
    if (v === '...') return '<li class="page-item disabled"><span class="page-link">…</span></li>';
    const active = v === currentPage ? ' active' : '';
    return `<li class="page-item${active}"><button class="page-link" data-page="${v}">${v}</button></li>`;
  }).join('');
  container.querySelectorAll('button[data-page]').forEach(btn =>
    btn.addEventListener('click', () => renderListingResults(Number(btn.dataset.page)))
  );
}

function attachListingEvents() {
  document.getElementById('filterForm')?.addEventListener('submit', e => { e.preventDefault(); renderListingResults(1); });
  document.getElementById('filterMake')?.addEventListener('change', e => populateModels(e.target.value));
  document.getElementById('resetFilters')?.addEventListener('click', () => {
    document.getElementById('filterForm').reset();
    populateSelects();
    renderListingResults(1);
  });
  document.getElementById('refreshListings')?.addEventListener('click', () => renderListingResults(1));
}

/* ════════════════════════════════════════════════════════════
   LISTING DETAIL
   ════════════════════════════════════════════════════════════ */
async function loadListingDetail(listingId) {
  setPageTitle('Listing Detail');
  if (!listingId) return;
  const detail = await fetchJson(`${apiBase}/listings/${listingId}`);
  if (!detail || detail.error) {
    document.getElementById('detailTitle').textContent = 'Vehicle not found';
    document.getElementById('detailSummary').textContent = detail?.error || 'Unable to load vehicle details.';
    return;
  }
  document.getElementById('detailImage').src        = safeImage(detail.image_url);
  document.getElementById('detailTitle').textContent = detail.title || `${detail.make || ''} ${detail.model || ''}`.trim();
  document.getElementById('detailSummary').textContent = `${detail.city || 'Location'} · ${detail.body_type || '—'} · ${formatPrice(detail.price, detail.price_currency)}`;
  document.getElementById('detailPrice').textContent       = formatPrice(detail.price, detail.price_currency);
  document.getElementById('detailYear').textContent        = detail.year || '—';
  document.getElementById('detailMake').textContent        = detail.make || '—';
  document.getElementById('detailModel').textContent       = detail.model || '—';
  document.getElementById('detailMileage').textContent     = formatMileage(detail.mileage_km);
  document.getElementById('detailCity').textContent        = detail.city || '—';
  document.getElementById('detailFuel').textContent        = detail.fuel || '—';
  document.getElementById('detailTransmission').textContent= detail.transmission || '—';
  document.getElementById('detailBodyType').textContent    = detail.body_type || '—';
  document.getElementById('detailEngine').textContent      = detail.engine_cc ? `${detail.engine_cc} cc` : '—';
  const extLink = document.getElementById('detailExternalLink');
  if (extLink) {
    extLink.href        = detail.detail_url || '#';
    extLink.textContent = detail.detail_url ? 'View listing on PakWheels' : 'View original listing';
  }
}

function getListingIdFromPath() {
  const match = window.location.pathname.match(/\/listing\/(\d+)/);
  return match ? Number(match[1]) : null;
}

/* ════════════════════════════════════════════════════════════
   ADMIN CONSOLE
   ════════════════════════════════════════════════════════════ */
let adminPage    = 1;
let adminFilters = {};
let deleteTargetId   = null;
let deleteTargetTitle = '';
let adminSelectedIds = new Set();
let adminRows = [];
let adminEventsAttached = false;

function getAdminSession() {
  try {
    return JSON.parse(localStorage.getItem('pakwheelsAdminSession') || 'null');
  } catch (e) {
    return null;
  }
}

function setAdminShell(session) {
  const loginPanel = document.getElementById('adminLoginPanel');
  const workspace = document.getElementById('adminWorkspace');
  if (!loginPanel || !workspace) return;
  if (!session) {
    loginPanel.classList.remove('d-none');
    workspace.classList.add('d-none');
    return;
  }
  loginPanel.classList.add('d-none');
  workspace.classList.remove('d-none');
  document.getElementById('adminUserName').textContent = session.name || 'Admin';
  document.getElementById('adminUserEmail').textContent = session.email || '';
  document.getElementById('adminPermissionList').innerHTML = (session.permissions || []).map(p => `
    <span class="permission-chip"><i class="fa-solid fa-check"></i>${p}</span>
  `).join('');
}

function attachAdminAuthEvents() {
  document.getElementById('adminLoginForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const alertBox = document.getElementById('adminLoginAlert');
    alertBox.classList.add('d-none');
    const res = await postJson(`${apiBase}/admin/login`, {
      email: document.getElementById('adminEmail').value,
      password: document.getElementById('adminPassword').value
    });
    if (res.status !== 200) {
      alertBox.textContent = res.data?.error || 'Unable to sign in.';
      alertBox.classList.remove('d-none');
      return;
    }
    localStorage.setItem('pakwheelsAdminSession', JSON.stringify(res.data.admin));
    setAdminShell(res.data.admin);
    await loadAdminBusinessData();
  });

  document.getElementById('adminLogout')?.addEventListener('click', () => {
    localStorage.removeItem('pakwheelsAdminSession');
    adminSelectedIds.clear();
    setAdminShell(null);
  });
}

async function loadAdminPage() {
  setPageTitle('Admin Console');
  attachAdminAuthEvents();
  const session = getAdminSession();
  setAdminShell(session);
  if (!session) return;
  await loadAdminBusinessData();
}

async function loadAdminBusinessData() {
  const overview = await fetchJson(`${apiBase}/analytics/overview`);
  if (overview && !overview.error) {
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('adminStatTotal',    (overview.total_listings || 0).toLocaleString('en-US'));
    set('adminStatAvgPrice', formatPrice(Math.round(overview.avg_price || 0)));
    set('adminStatMakes',    (overview.total_models   || 0).toLocaleString('en-US'));
    set('adminStatCities',   (overview.distinct_cities || 0).toLocaleString('en-US'));
    set('adminMarketValue',  formatMarketValue(overview.total_market_value));
  }

  /* Populate filter dropdowns */
  const [makes, cities] = await Promise.all([
    fetchJson(`${apiBase}/filters/makes`),
    fetchJson(`${apiBase}/filters/cities`)
  ]);
  fillSelect('adminMakeFilter', makes, 'All makes');
  fillSelect('adminCityFilter', cities, 'All cities');

  await loadAdminTable();
  attachAdminEvents();
}

async function loadAdminTable(page = 1) {
  adminPage = page;
  const params = { ...adminFilters, page, limit: 15 };
  const result = await fetchJson(`${apiBase}/listings${buildQuery(params)}`);
  const tbody = document.getElementById('adminTableBody');
  if (!tbody) return;
  if (!result || result.error) {
    tbody.innerHTML = `<tr><td colspan="10" class="text-center text-danger py-4">${result?.error || 'Failed to load.'}</td></tr>`;
    return;
  }
  const listings = result.data || [];
  adminRows = listings;
  if (!listings.length) {
    tbody.innerHTML = '<tr><td colspan="10" class="text-center text-muted py-4">No records match the current filter.</td></tr>';
    renderAdminPagination(1, 0, 15);
    return;
  }
  tbody.innerHTML = listings.map(item => `
    <tr>
      <td><input type="checkbox" class="form-check-input admin-row-check" data-id="${item.listing_id}" ${adminSelectedIds.has(Number(item.listing_id)) ? 'checked' : ''} /></td>
      <td class="text-muted small">${item.listing_id}</td>
      <td>
        <div class="fw-semibold">${item.make || '—'} ${item.model || ''}</div>
        <div class="text-muted small" style="max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.title || ''}</div>
      </td>
      <td>${item.year || '—'}</td>
      <td class="fw-semibold">${formatPrice(item.price, item.price_currency)}</td>
      <td>${item.city || '—'}</td>
      <td>${item.fuel || '—'} / ${item.transmission || '—'}</td>
      <td>${formatMileage(item.mileage_km)}</td>
      <td><span class="status-pill ${Number(item.price || 0) >= 4000000 ? 'featured' : 'reviewed'}">${Number(item.price || 0) >= 4000000 ? 'Premium' : 'Reviewed'}</span></td>
      <td>
        <div class="d-flex gap-1">
          <button class="admin-action-btn edit" title="Edit" data-id="${item.listing_id}" data-action="edit">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="admin-action-btn del" title="Delete" data-id="${item.listing_id}" data-title="${escapeHtml(item.title || `${item.make} ${item.model}`)}" data-action="delete">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  /* Row action listeners */
  document.querySelectorAll('[data-action="edit"]').forEach(btn =>
    btn.addEventListener('click', () => openEditModal(Number(btn.dataset.id)))
  );
  document.querySelectorAll('[data-action="delete"]').forEach(btn =>
    btn.addEventListener('click', () => openDeleteModal(Number(btn.dataset.id), btn.dataset.title))
  );
  document.querySelectorAll('.admin-row-check').forEach(box =>
    box.addEventListener('change', () => {
      const id = Number(box.dataset.id);
      if (box.checked) adminSelectedIds.add(id);
      else adminSelectedIds.delete(id);
      updateAdminSelectedCount();
    })
  );
  document.getElementById('adminSelectAll').checked = listings.every(item => adminSelectedIds.has(Number(item.listing_id)));
  updateAdminSelectedCount();

  renderAdminPagination(result.page, result.total, 15);
}

function updateAdminSelectedCount() {
  const el = document.getElementById('adminSelectedCount');
  if (el) el.textContent = `${adminSelectedIds.size} selected`;
}

function exportAdminCsv() {
  if (!adminRows.length) {
    showToast('No rows available to export.', 'error');
    return;
  }
  const headers = ['ID','Make','Model','Year','Price','City','Fuel','Transmission','Mileage'];
  const lines = adminRows.map(item => [
    item.listing_id, item.make, item.model, item.year, item.price, item.city,
    item.fuel, item.transmission, item.mileage_km
  ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
  const blob = new Blob([[headers.join(','), ...lines].join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'admin-listings.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function renderAdminPagination(currentPage, total, pageSize) {
  const pages = Math.ceil(total / pageSize) || 1;
  const container = document.getElementById('adminPagination');
  if (!container) return;
  if (pages <= 1) { container.innerHTML = ''; return; }
  const range = [];
  const start = Math.max(1, currentPage - 2);
  const end   = Math.min(pages, currentPage + 2);
  if (start > 1) range.push(1);
  if (start > 2) range.push('...');
  for (let i = start; i <= end; i++) range.push(i);
  if (end < pages - 1) range.push('...');
  if (end < pages) range.push(pages);
  container.innerHTML = range.map(v => {
    if (v === '...') return '<li class="page-item disabled"><span class="page-link">…</span></li>';
    const active = v === currentPage ? ' active' : '';
    return `<li class="page-item${active}"><button class="page-link" data-apage="${v}">${v}</button></li>`;
  }).join('');
  container.querySelectorAll('button[data-apage]').forEach(btn =>
    btn.addEventListener('click', () => loadAdminTable(Number(btn.dataset.apage)))
  );
}

function attachAdminEvents() {
  if (adminEventsAttached) return;
  adminEventsAttached = true;

  document.getElementById('adminRefresh')?.addEventListener('click', () => loadAdminTable(1));
  document.getElementById('adminExport')?.addEventListener('click', exportAdminCsv);
  document.getElementById('adminSelectAll')?.addEventListener('change', e => {
    adminRows.forEach(item => {
      const id = Number(item.listing_id);
      if (e.target.checked) adminSelectedIds.add(id);
      else adminSelectedIds.delete(id);
    });
    document.querySelectorAll('.admin-row-check').forEach(box => { box.checked = e.target.checked; });
    updateAdminSelectedCount();
  });
  document.getElementById('adminMarkFeatured')?.addEventListener('click', () => {
    showToast(`${adminSelectedIds.size} listing(s) marked for featured review.`, 'success');
  });
  document.getElementById('adminMarkReviewed')?.addEventListener('click', () => {
    showToast(`${adminSelectedIds.size} listing(s) marked reviewed.`, 'success');
  });
  document.getElementById('adminApplyFilter')?.addEventListener('click', () => {
    adminFilters = {
      search: document.getElementById('adminSearch')?.value,
      make:   document.getElementById('adminMakeFilter')?.value,
      city:   document.getElementById('adminCityFilter')?.value
    };
    loadAdminTable(1);
  });
  document.getElementById('adminClearFilter')?.addEventListener('click', () => {
    adminFilters = {};
    document.getElementById('adminSearch').value = '';
    document.getElementById('adminMakeFilter').value = '';
    document.getElementById('adminCityFilter').value = '';
    loadAdminTable(1);
  });

  /* Create modal open */
  document.getElementById('openCreateModal')?.addEventListener('click', () => {
    clearModal();
    document.getElementById('listingModalLabel').textContent = 'Add new listing';
    document.getElementById('modalListingId').value = '';
    document.getElementById('modalSaveBtn').textContent = 'Save listing';
  });

  /* Save button */
  document.getElementById('modalSaveBtn')?.addEventListener('click', saveListingModal);

  /* Delete confirm */
  document.getElementById('confirmDeleteBtn')?.addEventListener('click', confirmDelete);
}

async function openEditModal(listingId) {
  const detail = await fetchJson(`${apiBase}/listings/${listingId}`);
  if (!detail || detail.error) { showToast('Failed to load listing data.', 'error'); return; }
  clearModal();
  document.getElementById('listingModalLabel').textContent = `Edit listing #${listingId}`;
  document.getElementById('modalListingId').value   = listingId;
  document.getElementById('mTitle').value           = detail.title || '';
  document.getElementById('mMake').value            = detail.make || '';
  document.getElementById('mModel').value           = detail.model || '';
  document.getElementById('mYear').value            = detail.year || '';
  document.getElementById('mPrice').value           = detail.price || '';
  document.getElementById('mCity').value            = detail.city || '';
  document.getElementById('mFuel').value            = detail.fuel || 'Petrol';
  document.getElementById('mTransmission').value    = detail.transmission || 'Automatic';
  document.getElementById('mBodyType').value        = detail.body_type || 'Sedan';
  document.getElementById('mMileage').value         = detail.mileage_km || '';
  document.getElementById('mEngine').value          = detail.engine_cc || '';
  document.getElementById('mColor').value           = detail.color || '';
  document.getElementById('mImageUrl').value        = detail.image_url || '';
  document.getElementById('modalSaveBtn').innerHTML = '<i class="fa-solid fa-floppy-disk me-1"></i>Update listing';

  const modal = new bootstrap.Modal(document.getElementById('listingModal'));
  modal.show();
}

function openDeleteModal(listingId, title) {
  deleteTargetId    = listingId;
  deleteTargetTitle = title;
  document.getElementById('deleteModalTitle').textContent = title;
  const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
  modal.show();
}

async function saveListingModal() {
  const listingId = document.getElementById('modalListingId').value;
  const alertBox  = document.getElementById('modalAlertBox');
  alertBox.classList.add('d-none');

  const body = {
    title:        document.getElementById('mTitle').value.trim(),
    make:         document.getElementById('mMake').value.trim(),
    model:        document.getElementById('mModel').value.trim(),
    year:         document.getElementById('mYear').value,
    price:        document.getElementById('mPrice').value,
    city:         document.getElementById('mCity').value.trim(),
    fuel:         document.getElementById('mFuel').value,
    transmission: document.getElementById('mTransmission').value,
    body_type:    document.getElementById('mBodyType').value,
    mileage_km:   document.getElementById('mMileage').value,
    engine_cc:    document.getElementById('mEngine').value,
    color:        document.getElementById('mColor').value.trim(),
    image_url:    document.getElementById('mImageUrl').value.trim()
  };

  const saveBtn = document.getElementById('modalSaveBtn');
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Saving…';

  let res;
  if (listingId) {
    res = await putJson(`${apiBase}/listings/${listingId}`, body);
  } else {
    res = await postJson(`${apiBase}/listings`, body);
  }

  saveBtn.disabled = false;
  saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk me-1"></i>' + (listingId ? 'Update listing' : 'Save listing');

  if (res.status === 200 || res.status === 201) {
    bootstrap.Modal.getInstance(document.getElementById('listingModal')).hide();
    showToast(listingId ? 'Listing updated successfully!' : 'New listing created!', 'success');
    await loadAdminTable(adminPage);
  } else {
    const errors = res.data?.errors?.join('\n') || res.data?.error || 'An unknown error occurred.';
    alertBox.textContent = errors;
    alertBox.classList.remove('d-none');
  }
}

async function confirmDelete() {
  if (!deleteTargetId) return;
  const btn = document.getElementById('confirmDeleteBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Deleting…';

  const res = await deleteJson(`${apiBase}/listings/${deleteTargetId}`);
  btn.disabled = false;
  btn.innerHTML = '<i class="fa-solid fa-trash me-1"></i>Delete permanently';

  bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
  if (res.status === 200) {
    showToast(`Listing "${deleteTargetTitle}" deleted.`, 'success');
    await loadAdminTable(adminPage);
  } else {
    showToast(res.data?.error || 'Delete failed.', 'error');
  }
  deleteTargetId = deleteTargetTitle = null;
}

function clearModal() {
  ['mTitle','mMake','mModel','mYear','mPrice','mCity','mMileage','mEngine','mColor','mImageUrl'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('mFuel').value        = 'Petrol';
  document.getElementById('mTransmission').value = 'Automatic';
  document.getElementById('mBodyType').value     = 'Sedan';
  document.getElementById('modalAlertBox').classList.add('d-none');
}

function escapeHtml(str = '') {
  return str.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ════════════════════════════════════════════════════════════
   VEHICLE COMPARISON PAGE
   ════════════════════════════════════════════════════════════ */
let compareDataA = null;
let compareDataB = null;

async function loadComparePage() {
  setPageTitle('Vehicle Comparison');
  const makes = await fetchJson(`${apiBase}/filters/makes`);
  fillSelect('compareAMake', makes, 'Make…');
  fillSelect('compareBMake', makes, 'Make…');
  attachCompareEvents();
}

function attachCompareEvents() {
  document.getElementById('compareAMake')?.addEventListener('change', async e => {
    const models = e.target.value ? await fetchJson(`${apiBase}/filters/models?make=${encodeURIComponent(e.target.value)}`) : [];
    fillSelect('compareAModel', models, 'Model…');
    fillSelect('compareAListing', [], 'Select a listing…');
    compareDataA = null;
    updateCompareBtn();
  });

  document.getElementById('compareAModel')?.addEventListener('change', async e => {
    const make  = document.getElementById('compareAMake').value;
    const model = e.target.value;
    if (!make || !model) return;
    const result = await fetchJson(`${apiBase}/listings${buildQuery({make,model,limit:50,sort:'recent'})}`);
    const items = result?.data || [];
    document.getElementById('compareAListing').innerHTML =
      '<option value="">Select a listing…</option>' +
      items.map(i => `<option value="${i.listing_id}">${i.year || '—'} ${i.make} ${i.model} — ${formatPrice(i.price,i.price_currency)} (${i.city||'—'})</option>`).join('');
    compareDataA = null;
    updateCompareBtn();
  });

  document.getElementById('compareAListing')?.addEventListener('change', async e => {
    if (!e.target.value) { compareDataA = null; hideComparePreview('A'); updateCompareBtn(); return; }
    compareDataA = await fetchJson(`${apiBase}/listings/${e.target.value}`);
    showComparePreview('A', compareDataA);
    updateCompareBtn();
  });

  document.getElementById('compareBMake')?.addEventListener('change', async e => {
    const models = e.target.value ? await fetchJson(`${apiBase}/filters/models?make=${encodeURIComponent(e.target.value)}`) : [];
    fillSelect('compareBModel', models, 'Model…');
    fillSelect('compareBListing', [], 'Select a listing…');
    compareDataB = null;
    updateCompareBtn();
  });

  document.getElementById('compareBModel')?.addEventListener('change', async e => {
    const make  = document.getElementById('compareBMake').value;
    const model = e.target.value;
    if (!make || !model) return;
    const result = await fetchJson(`${apiBase}/listings${buildQuery({make,model,limit:50,sort:'recent'})}`);
    const items = result?.data || [];
    document.getElementById('compareBListing').innerHTML =
      '<option value="">Select a listing…</option>' +
      items.map(i => `<option value="${i.listing_id}">${i.year || '—'} ${i.make} ${i.model} — ${formatPrice(i.price,i.price_currency)} (${i.city||'—'})</option>`).join('');
    compareDataB = null;
    updateCompareBtn();
  });

  document.getElementById('compareBListing')?.addEventListener('change', async e => {
    if (!e.target.value) { compareDataB = null; hideComparePreview('B'); updateCompareBtn(); return; }
    compareDataB = await fetchJson(`${apiBase}/listings/${e.target.value}`);
    showComparePreview('B', compareDataB);
    updateCompareBtn();
  });

  document.getElementById('compareBtn')?.addEventListener('click', renderComparison);
  document.getElementById('clearCompare')?.addEventListener('click', () => {
    document.getElementById('compareResult').classList.add('d-none');
    compareDataA = compareDataB = null;
    ['compareAMake','compareAModel','compareAListing','compareBMake','compareBModel','compareBListing']
      .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    hideComparePreview('A');
    hideComparePreview('B');
    updateCompareBtn();
  });
}

function updateCompareBtn() {
  const btn  = document.getElementById('compareBtn');
  const hint = document.getElementById('compareHint');
  if (!btn) return;
  const ready = compareDataA && compareDataB;
  btn.disabled = !ready;
  if (hint) hint.textContent = ready ? 'Both vehicles selected — click to compare.' : 'Select both vehicles above to enable comparison.';
}

function showComparePreview(side, data) {
  if (!data || data.error) return;
  const preview = document.getElementById(`compare${side}Preview`);
  const img     = document.getElementById(`compare${side}Img`);
  const title   = document.getElementById(`compare${side}Title`);
  const price   = document.getElementById(`compare${side}Price`);
  if (!preview) return;
  img.src           = safeImage(data.image_url);
  title.textContent = `${data.year || ''} ${data.make || ''} ${data.model || ''}`.trim();
  price.textContent = formatPrice(data.price, data.price_currency);
  preview.classList.remove('d-none');
}

function hideComparePreview(side) {
  document.getElementById(`compare${side}Preview`)?.classList.add('d-none');
}

function renderComparison() {
  if (!compareDataA || !compareDataB) return;
  const A = compareDataA, B = compareDataB;

  document.getElementById('compareHeaderA').innerHTML =
    `<div class="fw-bold text-primary">${A.year || ''} ${A.make} ${A.model}</div>
     <div class="text-muted small">${A.city || '—'} · ID ${A.listing_id}</div>`;
  document.getElementById('compareHeaderB').innerHTML =
    `<div class="fw-bold text-success">${B.year || ''} ${B.make} ${B.model}</div>
     <div class="text-muted small">${B.city || '—'} · ID ${B.listing_id}</div>`;

  const specs = [
    { label: 'Price',        va: formatPrice(A.price, A.price_currency), vb: formatPrice(B.price, B.price_currency), numA: Number(A.price), numB: Number(B.price), lower: true },
    { label: 'Year',         va: A.year || '—',        vb: B.year || '—',        numA: Number(A.year),        numB: Number(B.year),        lower: false },
    { label: 'Mileage',      va: formatMileage(A.mileage_km), vb: formatMileage(B.mileage_km), numA: Number(A.mileage_km), numB: Number(B.mileage_km), lower: true },
    { label: 'Engine (cc)',  va: A.engine_cc ? `${A.engine_cc} cc` : '—', vb: B.engine_cc ? `${B.engine_cc} cc` : '—', numA: Number(A.engine_cc), numB: Number(B.engine_cc), lower: false },
    { label: 'Fuel',         va: A.fuel || '—',         vb: B.fuel || '—' },
    { label: 'Transmission', va: A.transmission || '—', vb: B.transmission || '—' },
    { label: 'Body type',    va: A.body_type || '—',    vb: B.body_type || '—' },
    { label: 'Color',        va: A.color || '—',        vb: B.color || '—' },
    { label: 'City',         va: A.city || '—',         vb: B.city || '—' },
    { label: 'Listing ID',   va: A.listing_id,           vb: B.listing_id }
  ];

  document.getElementById('compareSpecBody').innerHTML = specs.map(spec => {
    let classA = '', classB = '';
    if (spec.numA !== undefined && spec.numB !== undefined && !isNaN(spec.numA) && !isNaN(spec.numB) && spec.numA !== spec.numB) {
      const aWins = spec.lower ? spec.numA < spec.numB : spec.numA > spec.numB;
      classA = aWins ? 'spec-highlight' : '';
      classB = !aWins ? 'spec-highlight' : '';
    }
    return `
      <tr>
        <th class="ps-4 text-muted">${spec.label}</th>
        <td class="${classA}">${spec.va}</td>
        <td class="${classB}">${spec.vb}</td>
      </tr>
    `;
  }).join('');

  /* Summary deltas */
  const priceDiff = Math.abs(Number(A.price) - Number(B.price));
  const cheaper   = Number(A.price) < Number(B.price) ? `Vehicle A is cheaper` : `Vehicle B is cheaper`;
  document.getElementById('priceDiff').textContent = formatPrice(priceDiff);
  document.getElementById('priceDiffPct').textContent = cheaper;

  const mileDiff = Math.abs(Number(A.mileage_km) - Number(B.mileage_km));
  const lowerMile = Number(A.mileage_km) < Number(B.mileage_km) ? 'Vehicle A has lower mileage' : 'Vehicle B has lower mileage';
  document.getElementById('mileageDiff').textContent = formatMileage(mileDiff);
  document.getElementById('mileageSub').textContent  = lowerMile;

  const engDiff = Math.abs(Number(A.engine_cc) - Number(B.engine_cc));
  const bigEng  = Number(A.engine_cc) > Number(B.engine_cc) ? 'Vehicle A has larger engine' : 'Vehicle B has larger engine';
  document.getElementById('engineDiff').textContent = engDiff ? `${engDiff} cc` : 'Same';
  document.getElementById('engineSub').textContent  = engDiff ? bigEng : 'Engines are equal';

  document.getElementById('compareResult').classList.remove('d-none');
  document.getElementById('compareResult').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ════════════════════════════════════════════════════════════
   BOOT
   ════════════════════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  attachListingEvents();
  const page = document.body.dataset.page;
  if      (page === 'dashboard') loadDashboard();
  else if (page === 'listings')  loadListingsPage();
  else if (page === 'detail')    loadListingDetail(getListingIdFromPath());
  else if (page === 'admin')     loadAdminPage();
  else if (page === 'compare')   loadComparePage();
});
