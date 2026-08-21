/**
 * SIH 2026 Problem Statement Research Explorer
 * Flat Design & Mobile Optimized Controller
 */

// Application State
const state = {
  allProblems: [],
  filteredProblems: [],
  selectedIds: new Set(),
  bookmarkedIds: new Set(JSON.parse(localStorage.getItem('sih_bookmarks') || '[]')),
  
  filters: {
    search: '',
    searchScope: 'all',
    category: 'ALL',
    techTags: new Set(), // Multi-select Set of tag IDs
    theme: '',
    organization: '',
    department: '',
    hasDataset: false,
    hasLinks: false,
    hasVideo: false,
    hasContact: false,
    favoritesOnly: false,
    sortBy: 'id_asc'
  },
  
  currentView: 'cards', // 'cards' | 'table'
  activeModalProblem: null
};

// Tech tags mapping definition
const TECH_TAGS = [
  { id: 'ai_ml', label: 'AI / ML / Deep Learning', regex: /\b(ai|artificial intelligence|ml|machine learning|deep learning|neural network|cnn|lstm|transformer)\b/i },
  { id: 'cv', label: 'Computer Vision', regex: /\b(computer vision|image processing|yolo|object detection|ocr|facial recognition|camera)\b/i },
  { id: 'nlp', label: 'NLP / LLM / Voice', regex: /\b(nlp|natural language|llm|generative ai|speech|voice|audio|text analytics|chatbot)\b/i },
  { id: 'gis', label: 'GIS / Satellite', regex: /\b(gis|geospatial|satellite|remote sensing|geo-tagged|maps?|isro|dem|elevation)\b/i },
  { id: 'iot', label: 'IoT / Sensors', regex: /\b(iot|internet of things|sensor|microcontroller|arduino|esp32|raspberry|embedded)\b/i },
  { id: 'blockchain', label: 'Blockchain', regex: /\b(blockchain|smart contract|ledger|crypto|web3|decentralized|nft)\b/i },
  { id: 'drone', label: 'Robotics & UAV', regex: /\b(drone|uav|robotics|autonomous vehicle|unmanned|rover)\b/i },
  { id: 'mobile', label: 'Mobile Apps', regex: /\b(mobile app|android|ios|flutter|react native|smartphone)\b/i },
  { id: 'cloud', label: 'Cloud & Web', regex: /\b(cloud|dashboard|web application|portal|saas|api|microservices)\b/i },
  { id: 'health', label: 'HealthTech', regex: /\b(health|hospital|medical|clinical|ayurveda|diagnostic|patient|pharma)\b/i },
  { id: 'agri', label: 'AgriTech', regex: /\b(agri|agriculture|crop|farmer|farming|soil|irrigation|harvest|rural)\b/i },
  { id: 'cyber', label: 'Cybersecurity', regex: /\b(cyber|security|vulnerability|threat|encryption|forensic|audit|malware|ddos)\b/i }
];

// DOM Elements
const el = {
  searchInput: document.getElementById('searchInput'),
  searchScopeSelect: document.getElementById('searchScopeSelect'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
  categoryGroup: document.getElementById('categoryGroup'),
  techTagsContainer: document.getElementById('techTagsContainer'),
  themeSelect: document.getElementById('themeSelect'),
  orgSelect: document.getElementById('orgSelect'),
  deptFilterGroup: document.getElementById('deptFilterGroup'),
  deptSelect: document.getElementById('deptSelect'),
  filterHasDataset: document.getElementById('filterHasDataset'),
  filterHasLinks: document.getElementById('filterHasLinks'),
  filterHasVideo: document.getElementById('filterHasVideo'),
  filterHasContact: document.getElementById('filterHasContact'),
  filterFavoritesOnly: document.getElementById('filterFavoritesOnly'),
  favCount: document.getElementById('favCount'),
  sortSelect: document.getElementById('sortSelect'),
  resetFiltersBtn: document.getElementById('resetFiltersBtn'),
  emptyResetBtn: document.getElementById('emptyResetBtn'),
  
  // Drawer & Backdrop
  sidebarDrawer: document.getElementById('sidebarDrawer'),
  sidebarBackdrop: document.getElementById('sidebarBackdrop'),
  mobileFilterToggle: document.getElementById('mobileFilterToggle'),
  closeSidebarBtn: document.getElementById('closeSidebarBtn'),
  applyMobileFiltersBtn: document.getElementById('applyMobileFiltersBtn'),
  mobileActiveFilterCount: document.getElementById('mobileActiveFilterCount'),
  
  // Stats & Badges
  filteredCount: document.getElementById('filteredCount'),
  summaryCount: document.getElementById('summaryCount'),
  totalCount: document.getElementById('totalCount'),
  catAllCount: document.getElementById('catAllCount'),
  catSoftCount: document.getElementById('catSoftCount'),
  catHardCount: document.getElementById('catHardCount'),
  selectedCount: document.getElementById('selectedCount'),
  selectedCountBadge: document.getElementById('selectedCountBadge'),
  selectedCountBadge2: document.getElementById('selectedCountBadge2'),
  
  // Views
  cardsGrid: document.getElementById('cardsGrid'),
  tableContainer: document.getElementById('tableContainer'),
  tableBody: document.getElementById('tableBody'),
  emptyState: document.getElementById('emptyState'),
  viewCardsBtn: document.getElementById('viewCardsBtn'),
  viewTableBtn: document.getElementById('viewTableBtn'),
  
  // Selection
  selectAllCheckbox: document.getElementById('selectAllCheckbox'),
  selectAllTable: document.getElementById('selectAllTable'),
  
  // Active Filter Chips
  activeFiltersBar: document.getElementById('activeFiltersBar'),
  activeFilterChips: document.getElementById('activeFilterChips'),
  clearAllChipsBtn: document.getElementById('clearAllChipsBtn'),
  
  // Export Menu
  desktopExportBtn: document.getElementById('desktopExportBtn'),
  mobileExportBtn: document.getElementById('mobileExportBtn'),
  exportMenu: document.getElementById('exportMenu'),
  downloadFilteredJson: document.getElementById('downloadFilteredJson'),
  downloadFilteredCsv: document.getElementById('downloadFilteredCsv'),
  downloadSelectedJson: document.getElementById('downloadSelectedJson'),
  downloadSelectedCsv: document.getElementById('downloadSelectedCsv'),
  copyJsonClipboard: document.getElementById('copyJsonClipboard'),
  
  // Modal
  detailModalBackdrop: document.getElementById('detailModalBackdrop'),
  detailModalCard: document.getElementById('detailModalCard'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  modalCloseActionBtn: document.getElementById('modalCloseActionBtn'),
  modalCategoryBadge: document.getElementById('modalCategoryBadge'),
  modalPsId: document.getElementById('modalPsId'),
  modalThemeTag: document.getElementById('modalThemeTag'),
  modalTitle: document.getElementById('modalTitle'),
  modalOrg: document.getElementById('modalOrg'),
  modalDept: document.getElementById('modalDept'),
  modalSubmissions: document.getElementById('modalSubmissions'),
  modalDeadline: document.getElementById('modalDeadline'),
  modalDescriptionContent: document.getElementById('modalDescriptionContent'),
  modalSectionsContainer: document.getElementById('modalSectionsContainer'),
  modalDatasetInfo: document.getElementById('modalDatasetInfo'),
  modalLinksList: document.getElementById('modalLinksList'),
  modalMediaSection: document.getElementById('modalMediaSection'),
  modalYoutubeContent: document.getElementById('modalYoutubeContent'),
  modalContactSection: document.getElementById('modalContactSection'),
  modalContactContent: document.getElementById('modalContactContent'),
  copyModalMdBtn: document.getElementById('copyModalMdBtn'),
  modalFavoriteBtn: document.getElementById('modalFavoriteBtn'),
  modalOfficialLink: document.getElementById('modalOfficialLink'),
  
  // Toast
  toastContainer: document.getElementById('toastContainer')
};

// Initialize Application
async function init() {
  setupEventListeners();
  renderTechTags();
  
  try {
    const res = await fetch('sih2026_problem_statements.json');
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    
    state.allProblems = data.problem_statements || [];
    el.totalCount.textContent = state.allProblems.length;
    el.catAllCount.textContent = state.allProblems.length;
    
    const softCount = state.allProblems.filter(p => p.category === 'Software').length;
    const hardCount = state.allProblems.filter(p => p.category === 'Hardware').length;
    el.catSoftCount.textContent = softCount;
    el.catHardCount.textContent = hardCount;
    
    populateFilterDropdowns();
    updateFavoriteCount();
    applyFilters();
  } catch (err) {
    console.error('Failed to load dataset:', err);
    showToast('Failed to load dataset. Please ensure JSON exists.', 'error');
  }
}

// Populate Filter Dropdowns
function populateFilterDropdowns() {
  const themes = new Map();
  const orgs = new Map();
  
  state.allProblems.forEach(p => {
    themes.set(p.theme, (themes.get(p.theme) || 0) + 1);
    orgs.set(p.organization, (orgs.get(p.organization) || 0) + 1);
  });
  
  const sortedThemes = Array.from(themes.entries()).sort((a, b) => b[1] - a[1]);
  el.themeSelect.innerHTML = `<option value="">All Themes (${sortedThemes.length})</option>` +
    sortedThemes.map(([theme, count]) => `<option value="${escapeHtml(theme)}">${escapeHtml(theme)} (${count})</option>`).join('');
    
  const sortedOrgs = Array.from(orgs.entries()).sort((a, b) => b[1] - a[1]);
  el.orgSelect.innerHTML = `<option value="">All Organizations (${sortedOrgs.length})</option>` +
    sortedOrgs.map(([org, count]) => `<option value="${escapeHtml(org)}">${escapeHtml(org)} (${count})</option>`).join('');
}

// Update Department Dropdown based on selected organization
function updateDeptDropdown(selectedOrg) {
  if (!selectedOrg) {
    el.deptFilterGroup.style.display = 'none';
    el.deptSelect.innerHTML = '<option value="">All Departments</option>';
    state.filters.department = '';
    return;
  }
  
  const depts = new Set();
  state.allProblems
    .filter(p => p.organization === selectedOrg && p.department && p.department !== selectedOrg)
    .forEach(p => depts.add(p.department));
    
  if (depts.size > 0) {
    el.deptFilterGroup.style.display = 'block';
    el.deptSelect.innerHTML = '<option value="">All Departments</option>' +
      Array.from(depts).sort().map(d => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join('');
  } else {
    el.deptFilterGroup.style.display = 'none';
    el.deptSelect.innerHTML = '<option value="">All Departments</option>';
    state.filters.department = '';
  }
}

// Render Multi-Select Tech Tag filter pills
function renderTechTags() {
  el.techTagsContainer.innerHTML = TECH_TAGS.map(tag => {
    const isActive = state.filters.techTags.has(tag.id);
    return `
      <button class="tech-tag-pill ${isActive ? 'active' : ''}" data-tech-id="${tag.id}">
        ${tag.label}
      </button>
    `;
  }).join('');
}

// Apply Filters & Search
function applyFilters() {
  const {
    search,
    searchScope,
    category,
    techTags,
    theme,
    organization,
    department,
    hasDataset,
    hasLinks,
    hasVideo,
    hasContact,
    favoritesOnly,
    sortBy
  } = state.filters;
  
  const query = search.trim().toLowerCase();
  
  // Selected Tech Tag Objects
  const activeTagObjs = Array.from(techTags).map(id => TECH_TAGS.find(t => t.id === id)).filter(Boolean);
  
  let results = state.allProblems.filter(item => {
    // Category filter
    if (category !== 'ALL' && item.category !== category) return false;
    
    // Theme filter
    if (theme && item.theme !== theme) return false;
    
    // Organization filter
    if (organization && item.organization !== organization) return false;
    
    // Department filter
    if (department && item.department !== department) return false;
    
    // Attribute flags
    if (hasDataset && !item.dataset_info) return false;
    if (hasLinks && (!item.external_links || item.external_links.length === 0)) return false;
    if (hasVideo && !item.youtube_link) return false;
    if (hasContact && !item.contact_info) return false;
    if (favoritesOnly && !state.bookmarkedIds.has(item.id)) return false;
    
    // Multi-Select Tech Tags: Match ANY of the selected tags (OR condition)
    if (activeTagObjs.length > 0) {
      const fullText = `${item.title} ${item.description} ${item.theme}`;
      const matchesAnyTag = activeTagObjs.some(t => t.regex.test(fullText));
      if (!matchesAnyTag) return false;
    }
    
    // Search Query
    if (query) {
      if (searchScope === 'title') {
        return item.title.toLowerCase().includes(query);
      } else if (searchScope === 'description') {
        return item.description.toLowerCase().includes(query);
      } else if (searchScope === 'organization') {
        return item.organization.toLowerCase().includes(query) || (item.department && item.department.toLowerCase().includes(query));
      } else if (searchScope === 'id') {
        return item.id.toLowerCase().includes(query) || (item.numeric_id && String(item.numeric_id).includes(query));
      } else {
        const fullContent = `${item.id} ${item.title} ${item.organization} ${item.department} ${item.theme} ${item.description} ${item.dataset_info || ''}`.toLowerCase();
        return fullContent.includes(query);
      }
    }
    
    return true;
  });
  
  // Sorting
  results.sort((a, b) => {
    switch (sortBy) {
      case 'id_asc':
        return (a.numeric_id || 0) - (b.numeric_id || 0);
      case 'id_desc':
        return (b.numeric_id || 0) - (a.numeric_id || 0);
      case 'title_asc':
        return a.title.localeCompare(b.title);
      case 'title_desc':
        return b.title.localeCompare(a.title);
      case 'org_asc':
        return a.organization.localeCompare(b.organization);
      case 'theme_asc':
        return a.theme.localeCompare(b.theme);
      case 'desc_len_desc':
        return (b.description || '').length - (a.description || '').length;
      default:
        return 0;
    }
  });
  
  state.filteredProblems = results;
  el.filteredCount.textContent = results.length;
  el.summaryCount.textContent = results.length;
  document.querySelectorAll('.export-filtered-num, .export-filtered-num2').forEach(elem => {
    elem.textContent = results.length;
  });
  
  renderActiveFilterChips();
  renderResults();
  updateSelectionCounters();
  updateMobileFilterBadge();
}

// Update Active Mobile Filter Badge
function updateMobileFilterBadge() {
  let count = 0;
  if (state.filters.search) count++;
  if (state.filters.category !== 'ALL') count++;
  count += state.filters.techTags.size;
  if (state.filters.theme) count++;
  if (state.filters.organization) count++;
  if (state.filters.department) count++;
  if (state.filters.hasDataset) count++;
  if (state.filters.hasLinks) count++;
  if (state.filters.hasVideo) count++;
  if (state.filters.hasContact) count++;
  if (state.filters.favoritesOnly) count++;
  
  if (count > 0) {
    el.mobileActiveFilterCount.textContent = count;
    el.mobileActiveFilterCount.style.display = 'inline-block';
  } else {
    el.mobileActiveFilterCount.style.display = 'none';
  }
}

// Render Results based on current view
function renderResults() {
  if (state.filteredProblems.length === 0) {
    el.cardsGrid.style.display = 'none';
    el.tableContainer.style.display = 'none';
    el.emptyState.style.display = 'block';
    return;
  }
  
  el.emptyState.style.display = 'none';
  
  if (state.currentView === 'cards') {
    el.cardsGrid.style.display = 'grid';
    el.tableContainer.style.display = 'none';
    renderCards();
  } else {
    el.cardsGrid.style.display = 'none';
    el.tableContainer.style.display = 'block';
    renderTable();
  }
}

// Highlight query terms in text
function highlightText(text, query) {
  if (!query || !text) return escapeHtml(text || '');
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  return escapeHtml(text).replace(regex, '<mark>$1</mark>');
}

// Render Flat Cards
function renderCards() {
  const query = state.filters.search.trim();
  
  el.cardsGrid.innerHTML = state.filteredProblems.map(item => {
    const isSelected = state.selectedIds.has(item.id);
    const isFavorited = state.bookmarkedIds.has(item.id);
    const badgeClass = item.category === 'Software' ? 'badge-software' : 'badge-hardware';
    
    let cleanDesc = item.description.replace(/\*\*/g, '').replace(/^- /gm, '');
    
    return `
      <div class="flat-card ${isSelected ? 'selected' : ''}" data-id="${item.id}">
        <div class="card-header-line">
          <div class="card-badges">
            <span class="color-badge ${badgeClass}">${item.category}</span>
            <span class="mono-id-tag">${highlightText(item.id, query)}</span>
            <span class="theme-tag-flat" title="${escapeHtml(item.theme)}">${highlightText(item.theme, query)}</span>
          </div>
          
          <div class="card-tools">
            <button class="star-btn ${isFavorited ? 'favorited' : ''}" data-id="${item.id}" title="${isFavorited ? 'Remove Bookmark' : 'Bookmark'}">
              ${isFavorited ? '★' : '☆'}
            </button>
            <label class="flat-checkbox-label" title="Select statement">
              <input type="checkbox" class="card-select-check" data-id="${item.id}" ${isSelected ? 'checked' : ''}>
              <span class="flat-checkbox"></span>
            </label>
          </div>
        </div>
        
        <h3 class="card-heading view-detail-trigger" data-id="${item.id}">${highlightText(item.title, query)}</h3>
        
        <div class="card-org-text">
          <span>🏛️</span>
          <span>${highlightText(item.organization, query)}</span>
        </div>
        
        <div class="card-body-text">${highlightText(cleanDesc, query)}</div>
        
        <div class="card-bottom-line">
          <div class="meta-tags-row">
            ${item.dataset_info ? '<span class="meta-pill active-pill" title="Dataset Attached">📊 Dataset</span>' : ''}
            ${item.external_links && item.external_links.length > 0 ? `<span class="meta-pill" title="${item.external_links.length} URLs">🔗 ${item.external_links.length} Links</span>` : ''}
            ${item.youtube_link ? '<span class="meta-pill" title="Video Reference">▶️ Video</span>' : ''}
          </div>
          
          <button class="btn btn-sm btn-secondary view-detail-trigger" data-id="${item.id}">
            Details &rarr;
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Render Table View
function renderTable() {
  const query = state.filters.search.trim();
  
  el.tableBody.innerHTML = state.filteredProblems.map(item => {
    const isSelected = state.selectedIds.has(item.id);
    const isFavorited = state.bookmarkedIds.has(item.id);
    const badgeClass = item.category === 'Software' ? 'badge-software' : 'badge-hardware';
    
    return `
      <tr class="${isSelected ? 'selected' : ''}" data-id="${item.id}">
        <td>
          <label class="flat-checkbox-label">
            <input type="checkbox" class="table-row-check" data-id="${item.id}" ${isSelected ? 'checked' : ''}>
            <span class="flat-checkbox"></span>
          </label>
        </td>
        <td>
          <span class="mono-id-tag">${highlightText(item.id, query)}</span>
        </td>
        <td>
          <span class="color-badge ${badgeClass}">${item.category}</span>
        </td>
        <td>
          <a href="#" class="view-detail-trigger" data-id="${item.id}" style="color:var(--text-main); font-weight:600; text-decoration:none;">
            ${highlightText(item.title, query)}
          </a>
        </td>
        <td>
          <span class="theme-tag-flat">${highlightText(item.theme, query)}</span>
        </td>
        <td style="font-size:0.8rem; color:var(--text-muted);">
          ${highlightText(item.organization, query)}
        </td>
        <td style="text-align:right;">
          <div style="display:inline-flex; gap:6px;">
            <button class="btn btn-sm btn-secondary view-detail-trigger" data-id="${item.id}">View</button>
            <button class="star-btn ${isFavorited ? 'favorited' : ''}" data-id="${item.id}">
              ${isFavorited ? '★' : '☆'}
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Render Active Filter Chips
function renderActiveFilterChips() {
  const chips = [];
  const { search, category, techTags, theme, organization, department, hasDataset, hasLinks, hasVideo, hasContact, favoritesOnly } = state.filters;
  
  if (search) chips.push({ label: `"${search}"`, key: 'search' });
  if (category !== 'ALL') chips.push({ label: `Category: ${category}`, key: 'category' });
  
  techTags.forEach(tagId => {
    const t = TECH_TAGS.find(x => x.id === tagId);
    if (t) chips.push({ label: `Tag: ${t.label}`, key: `techTag_${tagId}` });
  });
  
  if (theme) chips.push({ label: `Theme: ${theme}`, key: 'theme' });
  if (organization) chips.push({ label: `Org: ${organization}`, key: 'organization' });
  if (department) chips.push({ label: `Dept: ${department}`, key: 'department' });
  if (hasDataset) chips.push({ label: 'With Dataset', key: 'hasDataset' });
  if (hasLinks) chips.push({ label: 'With Links', key: 'hasLinks' });
  if (hasVideo) chips.push({ label: 'With Video', key: 'hasVideo' });
  if (hasContact) chips.push({ label: 'With Contact', key: 'hasContact' });
  if (favoritesOnly) chips.push({ label: 'Bookmarked', key: 'favoritesOnly' });
  
  if (chips.length > 0) {
    el.activeFiltersBar.style.display = 'flex';
    el.activeFilterChips.innerHTML = chips.map(c => `
      <span class="flat-chip">
        ${escapeHtml(c.label)}
        <span class="chip-x" data-chip-key="${c.key}">&times;</span>
      </span>
    `).join('');
  } else {
    el.activeFiltersBar.style.display = 'none';
    el.activeFilterChips.innerHTML = '';
  }
}

// Open Detail Modal
function openDetailModal(problemId) {
  const problem = state.allProblems.find(p => p.id === problemId);
  if (!problem) return;
  
  state.activeModalProblem = problem;
  
  el.modalCategoryBadge.textContent = problem.category;
  el.modalCategoryBadge.className = `color-badge ${problem.category === 'Software' ? 'badge-software' : 'badge-hardware'}`;
  el.modalPsId.textContent = problem.id;
  el.modalThemeTag.textContent = problem.theme;
  el.modalTitle.textContent = problem.title;
  el.modalOrg.textContent = problem.organization;
  el.modalDept.textContent = problem.department || problem.organization;
  el.modalSubmissions.textContent = problem.submitted_ideas ? `${problem.submitted_ideas.count}/${problem.submitted_ideas.capacity}` : '0/500';
  el.modalDeadline.textContent = problem.deadline;
  
  // Render Full Description Tab
  el.modalDescriptionContent.innerHTML = formatMarkdownToHtml(problem.description);
  
  // Render Structured Sections Tab
  const secKeys = Object.keys(problem.sections || {});
  if (secKeys.length > 0 && !(secKeys.length === 1 && secKeys[0] === 'full')) {
    el.modalSectionsContainer.innerHTML = secKeys.map(k => {
      const sec = problem.sections[k];
      const title = sec.title || k.replace(/_/g, ' ').toUpperCase();
      const content = sec.content || sec;
      return `
        <div class="section-flat-box">
          <div class="section-flat-title">${escapeHtml(title)}</div>
          <div class="section-flat-content">${formatMarkdownToHtml(content)}</div>
        </div>
      `;
    }).join('');
  } else {
    el.modalSectionsContainer.innerHTML = `
      <div class="section-flat-box">
        <div class="section-flat-title">Full Description</div>
        <div class="section-flat-content">${formatMarkdownToHtml(problem.description)}</div>
      </div>
    `;
  }
  
  // Datasets & Links Tab
  if (problem.dataset_info) {
    el.modalDatasetInfo.innerHTML = formatMarkdownToHtml(problem.dataset_info);
  } else {
    el.modalDatasetInfo.textContent = 'No specific dataset or benchmark information specified.';
  }
  
  if (problem.external_links && problem.external_links.length > 0) {
    el.modalLinksList.innerHTML = problem.external_links.map(link => `
      <li><a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link)} &nearr;</a></li>
    `).join('');
  } else {
    el.modalLinksList.innerHTML = '<li style="color:var(--text-muted);">No external links found in statement.</li>';
  }
  
  if (problem.youtube_link) {
    el.modalMediaSection.style.display = 'block';
    el.modalYoutubeContent.innerHTML = `<a href="${escapeHtml(problem.youtube_link)}" target="_blank" class="btn btn-sm btn-secondary">▶️ Watch Reference Video</a>`;
  } else {
    el.modalMediaSection.style.display = 'none';
  }
  
  if (problem.contact_info) {
    el.modalContactSection.style.display = 'block';
    el.modalContactContent.textContent = problem.contact_info;
  } else {
    el.modalContactSection.style.display = 'none';
  }
  
  // Bookmark button in modal
  const isFav = state.bookmarkedIds.has(problem.id);
  el.modalFavoriteBtn.textContent = isFav ? '★ Bookmarked' : '☆ Bookmark';
  
  // Official Portal Link
  el.modalOfficialLink.href = problem.web_url || `https://sih.gov.in/sih2026PS#${problem.modal_id}`;
  
  // Reset tab to first tab
  document.querySelectorAll('.flat-tab-btn').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelector('.flat-tab-btn[data-tab="full-desc"]').classList.add('active');
  document.getElementById('tab-full-desc').classList.add('active');
  
  el.detailModalBackdrop.classList.add('show');
  document.body.classList.add('no-scroll');
}

function closeDetailModal() {
  el.detailModalBackdrop.classList.remove('show');
  if (!el.sidebarDrawer.classList.contains('open')) {
    document.body.classList.remove('no-scroll');
  }
  state.activeModalProblem = null;
}

// Convert clean markdown strings to readable HTML with bold, paragraphs & nested lists using standard marked library
function formatMarkdownToHtml(md) {
  if (!md) return '';
  const trimmed = md.trim();
  
  if (typeof marked !== 'undefined' && marked.parse) {
    // Configure standard marked parser
    marked.setOptions({
      gfm: true,
      breaks: true
    });
    
    let html = marked.parse(trimmed);
    
    // Add target="_blank" to external links
    html = html.replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"([^>]*)>/gi, (match, href, rest) => {
      if (href.startsWith('http://') || href.startsWith('https://')) {
        return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color:var(--primary); font-weight:600; text-decoration:underline;"${rest}>`;
      }
      return match;
    });
    
    if (typeof DOMPurify !== 'undefined') {
      return DOMPurify.sanitize(html, { ADD_ATTR: ['target', 'rel'] });
    }
    return html;
  }
  
  // Fallback if marked CDN fails to load
  let str = escapeHtml(trimmed);
  str = str.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  str = str.replace(/^[•\-*]\s*(.*?)$/gm, '<li class="prose-li">$1</li>');
  str = str.replace(/((?:<li class="prose-li">.*?<\/li>\s*)+)/g, '<ul class="prose-ul">$1</ul>');
  const blocks = str.split(/\n{2,}/);
  return blocks.map(b => {
    b = b.trim();
    if (!b) return '';
    if (b.startsWith('<ul') || b.startsWith('<ol')) return b;
    return `<p class="prose-p">${b.replace(/\n/g, '<br/>')}</p>`;
  }).filter(Boolean).join('');
}

// Generate clean, beautifully formatted Markdown representation of a problem statement
function generateProblemMarkdown(problem) {
  if (!problem) return '';
  
  let md = `# [${problem.id}] ${problem.title}\n\n`;
  
  md += `| Attribute | Details |\n`;
  md += `| :--- | :--- |\n`;
  md += `| **Category** | ${problem.category || 'N/A'} |\n`;
  md += `| **Theme** | ${problem.theme || 'N/A'} |\n`;
  md += `| **Organization** | ${problem.organization || 'N/A'} |\n`;
  md += `| **Department** | ${problem.department || 'N/A'} |\n`;
  md += `| **Submissions** | ${problem.submitted_ideas?.raw || '0/500'} |\n`;
  md += `| **Deadline** | ${problem.deadline || 'N/A'} |\n`;
  
  const officialUrl = problem.web_url || (problem.modal_id ? `https://sih.gov.in/sih2026PS#${problem.modal_id}` : null);
  if (officialUrl) {
    md += `| **Official Portal Link** | [${problem.id} on SIH 2026](${officialUrl}) |\n`;
  }
  
  md += `\n---\n\n`;
  md += `## Description\n\n`;
  md += `${(problem.description || '').trim()}\n\n`;
  
  if (problem.dataset_info) {
    md += `---\n\n## Relevant Data Availability\n\n${problem.dataset_info.trim()}\n\n`;
  }
  
  if (problem.external_links && problem.external_links.length > 0) {
    md += `---\n\n## External References\n\n`;
    problem.external_links.forEach(link => {
      md += `- ${link}\n`;
    });
    md += `\n`;
  }
  
  if (problem.youtube_link) {
    md += `---\n\n## Media Reference\n\n- [Watch Video Reference](${problem.youtube_link})\n\n`;
  }
  
  if (problem.contact_info) {
    md += `---\n\n## Contact Information\n\n${problem.contact_info.trim()}\n\n`;
  }
  
  return md.trim();
}

// Toggle Bookmark
function toggleBookmark(id) {
  if (state.bookmarkedIds.has(id)) {
    state.bookmarkedIds.delete(id);
    showToast(`Removed ${id} from bookmarks`, 'info');
  } else {
    state.bookmarkedIds.add(id);
    showToast(`Bookmarked ${id} ★`, 'success');
  }
  localStorage.setItem('sih_bookmarks', JSON.stringify(Array.from(state.bookmarkedIds)));
  updateFavoriteCount();
  
  if (state.filters.favoritesOnly) {
    applyFilters();
  } else {
    renderResults();
  }
}

function updateFavoriteCount() {
  el.favCount.textContent = state.bookmarkedIds.size;
}

// Update Selection Counters
function updateSelectionCounters() {
  const count = state.selectedIds.size;
  el.selectedCount.textContent = count;
  el.selectedCountBadge.textContent = count;
  el.selectedCountBadge2.textContent = count;
  
  const allFilteredSelected = state.filteredProblems.length > 0 && 
    state.filteredProblems.every(p => state.selectedIds.has(p.id));
    
  el.selectAllCheckbox.checked = allFilteredSelected;
  el.selectAllTable.checked = allFilteredSelected;
}

// Toggle Select All Filtered
function toggleSelectAllFiltered(checked) {
  if (checked) {
    state.filteredProblems.forEach(p => state.selectedIds.add(p.id));
  } else {
    state.filteredProblems.forEach(p => state.selectedIds.delete(p.id));
  }
  updateSelectionCounters();
  renderResults();
}

// Transform raw problem object to clean, concise export object (matching MD content, no scraper bloat)
function formatProblemForExport(p) {
  if (!p) return null;
  const item = {
    id: p.id,
    title: p.title,
    category: p.category,
    theme: p.theme,
    organization: p.organization,
    department: p.department,
    submissions: p.submitted_ideas?.raw || (typeof p.submitted_ideas === 'string' ? p.submitted_ideas : '0/500'),
    deadline: p.deadline || '20 September 2026',
    official_url: p.web_url || (p.modal_id ? `https://sih.gov.in/sih2026PS#${p.modal_id}` : `https://sih.gov.in/sih2026PS#ViewProblemStatement${p.id.replace('SIH', '')}`),
    description: (p.description || '').trim()
  };
  
  if (p.dataset_info) {
    item.dataset_info = p.dataset_info.trim();
  }
  if (p.external_links && p.external_links.length > 0) {
    item.external_links = p.external_links;
  }
  if (p.youtube_link) {
    item.youtube_link = p.youtube_link;
  }
  if (p.contact_info) {
    item.contact_info = p.contact_info.trim();
  }
  if (p.sections && Object.keys(p.sections).length > 0) {
    item.sections = p.sections;
  }
  
  return item;
}

// Downloads & Exports
function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  triggerDownload(blob, filename);
}

function downloadCSV(items, filename) {
  const headers = [
    'PS ID',
    'Title',
    'Category',
    'Theme',
    'Organization',
    'Department',
    'Submissions',
    'Deadline',
    'Official URL',
    'Description',
    'Dataset Info',
    'External Links',
    'YouTube Link',
    'Contact Info'
  ];
  
  const csvRows = [headers.join(',')];
  
  items.forEach(p => {
    const formatted = formatProblemForExport(p);
    const row = [
      escapeCsvCell(formatted.id),
      escapeCsvCell(formatted.title),
      escapeCsvCell(formatted.category),
      escapeCsvCell(formatted.theme),
      escapeCsvCell(formatted.organization),
      escapeCsvCell(formatted.department),
      escapeCsvCell(formatted.submissions),
      escapeCsvCell(formatted.deadline),
      escapeCsvCell(formatted.official_url),
      escapeCsvCell(formatted.description),
      escapeCsvCell(formatted.dataset_info || ''),
      escapeCsvCell((formatted.external_links || []).join('; ')),
      escapeCsvCell(formatted.youtube_link || ''),
      escapeCsvCell(formatted.contact_info || '')
    ];
    csvRows.push(row.join(','));
  });
  
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
}

function escapeCsvCell(cell) {
  if (cell === null || cell === undefined) return '""';
  const str = String(cell).replace(/"/g, '""');
  return `"${str}"`;
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`Downloaded ${filename}`, 'success');
}

// Toast Notifications
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = 'flat-toast';
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : '●';
  toast.innerHTML = `<span>${icon}</span><span>${escapeHtml(message)}</span>`;
  el.toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.2s';
    setTimeout(() => toast.remove(), 200);
  }, 2800);
}

// Utility: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Event Listeners Setup
function setupEventListeners() {
  // Mobile drawer controls
  function openMobileDrawer() {
    el.sidebarDrawer.classList.add('open');
    el.sidebarBackdrop.classList.add('show');
    document.body.classList.add('no-scroll');
  }
  
  function closeMobileDrawer() {
    el.sidebarDrawer.classList.remove('open');
    el.sidebarBackdrop.classList.remove('show');
    if (!el.detailModalBackdrop.classList.contains('show')) {
      document.body.classList.remove('no-scroll');
    }
  }
  
  el.mobileFilterToggle.addEventListener('click', openMobileDrawer);
  el.closeSidebarBtn.addEventListener('click', closeMobileDrawer);
  el.sidebarBackdrop.addEventListener('click', closeMobileDrawer);
  el.applyMobileFiltersBtn.addEventListener('click', closeMobileDrawer);

  // Multi-Select Tech Tag Click Handler
  el.techTagsContainer.addEventListener('click', e => {
    const btn = e.target.closest('.tech-tag-pill');
    if (!btn) return;
    const tagId = btn.dataset.techId;
    
    if (state.filters.techTags.has(tagId)) {
      state.filters.techTags.delete(tagId);
      btn.classList.remove('active');
    } else {
      state.filters.techTags.add(tagId);
      btn.classList.add('active');
    }
    applyFilters();
  });

  // Search input debounce
  let debounceTimer;
  el.searchInput.addEventListener('input', e => {
    clearTimeout(debounceTimer);
    el.clearSearchBtn.style.display = e.target.value ? 'block' : 'none';
    debounceTimer = setTimeout(() => {
      state.filters.search = e.target.value;
      applyFilters();
    }, 200);
  });
  
  el.clearSearchBtn.addEventListener('click', () => {
    el.searchInput.value = '';
    el.clearSearchBtn.style.display = 'none';
    state.filters.search = '';
    applyFilters();
  });
  
  el.searchScopeSelect.addEventListener('change', e => {
    state.filters.searchScope = e.target.value;
    applyFilters();
  });
  
  // Category Segmented Control
  el.categoryGroup.addEventListener('click', e => {
    const seg = e.target.closest('.flat-segment');
    if (!seg) return;
    el.categoryGroup.querySelectorAll('.flat-segment').forEach(s => s.classList.remove('active'));
    seg.classList.add('active');
    state.filters.category = seg.dataset.category;
    applyFilters();
  });
  
  // Theme Select
  el.themeSelect.addEventListener('change', e => {
    state.filters.theme = e.target.value;
    applyFilters();
  });
  
  // Organization Select
  el.orgSelect.addEventListener('change', e => {
    const org = e.target.value;
    state.filters.organization = org;
    updateDeptDropdown(org);
    applyFilters();
  });
  
  // Department Select
  el.deptSelect.addEventListener('change', e => {
    state.filters.department = e.target.value;
    applyFilters();
  });
  
  // Checkbox Attributes
  el.filterHasDataset.addEventListener('change', e => {
    state.filters.hasDataset = e.target.checked;
    applyFilters();
  });
  el.filterHasLinks.addEventListener('change', e => {
    state.filters.hasLinks = e.target.checked;
    applyFilters();
  });
  el.filterHasVideo.addEventListener('change', e => {
    state.filters.hasVideo = e.target.checked;
    applyFilters();
  });
  el.filterHasContact.addEventListener('change', e => {
    state.filters.hasContact = e.target.checked;
    applyFilters();
  });
  el.filterFavoritesOnly.addEventListener('change', e => {
    state.filters.favoritesOnly = e.target.checked;
    applyFilters();
  });
  
  // Sort
  el.sortSelect.addEventListener('change', e => {
    state.filters.sortBy = e.target.value;
    applyFilters();
  });
  
  // Reset Filters
  function resetFilters() {
    state.filters = {
      search: '',
      searchScope: 'all',
      category: 'ALL',
      techTags: new Set(),
      theme: '',
      organization: '',
      department: '',
      hasDataset: false,
      hasLinks: false,
      hasVideo: false,
      hasContact: false,
      favoritesOnly: false,
      sortBy: 'id_asc'
    };
    
    el.searchInput.value = '';
    el.clearSearchBtn.style.display = 'none';
    el.searchScopeSelect.value = 'all';
    el.categoryGroup.querySelectorAll('.flat-segment').forEach(s => s.classList.toggle('active', s.dataset.category === 'ALL'));
    el.techTagsContainer.querySelectorAll('.tech-tag-pill').forEach(b => b.classList.remove('active'));
    el.themeSelect.value = '';
    el.orgSelect.value = '';
    el.deptSelect.value = '';
    el.deptFilterGroup.style.display = 'none';
    el.filterHasDataset.checked = false;
    el.filterHasLinks.checked = false;
    el.filterHasVideo.checked = false;
    el.filterHasContact.checked = false;
    el.filterFavoritesOnly.checked = false;
    el.sortSelect.value = 'id_asc';
    
    applyFilters();
    showToast('Filters reset', 'info');
  }
  
  el.resetFiltersBtn.addEventListener('click', resetFilters);
  el.emptyResetBtn.addEventListener('click', resetFilters);
  el.clearAllChipsBtn.addEventListener('click', resetFilters);
  
  // Active Chip Removal
  el.activeFilterChips.addEventListener('click', e => {
    const removeBtn = e.target.closest('.chip-x');
    if (!removeBtn) return;
    const key = removeBtn.dataset.chipKey;
    
    if (key === 'search') {
      el.searchInput.value = '';
      el.clearSearchBtn.style.display = 'none';
      state.filters.search = '';
    } else if (key === 'category') {
      state.filters.category = 'ALL';
      el.categoryGroup.querySelectorAll('.flat-segment').forEach(s => s.classList.toggle('active', s.dataset.category === 'ALL'));
    } else if (key.startsWith('techTag_')) {
      const tagId = key.replace('techTag_', '');
      state.filters.techTags.delete(tagId);
      const pill = el.techTagsContainer.querySelector(`.tech-tag-pill[data-tech-id="${tagId}"]`);
      if (pill) pill.classList.remove('active');
    } else if (key === 'theme') {
      state.filters.theme = '';
      el.themeSelect.value = '';
    } else if (key === 'organization') {
      state.filters.organization = '';
      el.orgSelect.value = '';
      updateDeptDropdown('');
    } else if (key === 'department') {
      state.filters.department = '';
      el.deptSelect.value = '';
    } else if (key === 'hasDataset') {
      state.filters.hasDataset = false;
      el.filterHasDataset.checked = false;
    } else if (key === 'hasLinks') {
      state.filters.hasLinks = false;
      el.filterHasLinks.checked = false;
    } else if (key === 'hasVideo') {
      state.filters.hasVideo = false;
      el.filterHasVideo.checked = false;
    } else if (key === 'hasContact') {
      state.filters.hasContact = false;
      el.filterHasContact.checked = false;
    } else if (key === 'favoritesOnly') {
      state.filters.favoritesOnly = false;
      el.filterFavoritesOnly.checked = false;
    }
    applyFilters();
  });
  
  // View Toggle
  el.viewCardsBtn.addEventListener('click', () => {
    state.currentView = 'cards';
    el.viewCardsBtn.classList.add('active');
    el.viewTableBtn.classList.remove('active');
    renderResults();
  });
  
  el.viewTableBtn.addEventListener('click', () => {
    state.currentView = 'table';
    el.viewTableBtn.classList.add('active');
    el.viewCardsBtn.classList.remove('active');
    renderResults();
  });
  
  // Selection Toggle
  el.selectAllCheckbox.addEventListener('change', e => {
    toggleSelectAllFiltered(e.target.checked);
  });
  
  // Click Delegation on Grid / Table
  function handleItemClick(e) {
    const detailBtn = e.target.closest('.view-detail-trigger');
    if (detailBtn) {
      e.preventDefault();
      const id = detailBtn.dataset.id;
      openDetailModal(id);
      return;
    }
    
    const favBtn = e.target.closest('.star-btn');
    if (favBtn) {
      e.stopPropagation();
      const id = favBtn.dataset.id;
      toggleBookmark(id);
      return;
    }
    
    const check = e.target.closest('.card-select-check, .table-row-check');
    if (check) {
      e.stopPropagation();
      const id = check.dataset.id;
      if (check.checked) {
        state.selectedIds.add(id);
      } else {
        state.selectedIds.delete(id);
      }
      updateSelectionCounters();
      const card = document.querySelector(`.flat-card[data-id="${id}"]`);
      if (card) card.classList.toggle('selected', check.checked);
      const row = document.querySelector(`tr[data-id="${id}"]`);
      if (row) row.classList.toggle('selected', check.checked);
    }
  }
  
  el.cardsGrid.addEventListener('click', handleItemClick);
  el.tableBody.addEventListener('click', handleItemClick);
  
  // Export Menu Toggle
  function toggleExportMenu(e) {
    e.stopPropagation();
    const btn = e.currentTarget;
    const parent = btn.closest('.export-dropdown');
    if (parent && el.exportMenu) {
      if (el.exportMenu.parentElement !== parent) {
        parent.appendChild(el.exportMenu);
      }
      el.exportMenu.classList.toggle('show');
    }
  }
  
  if (el.desktopExportBtn) el.desktopExportBtn.addEventListener('click', toggleExportMenu);
  if (el.mobileExportBtn) el.mobileExportBtn.addEventListener('click', toggleExportMenu);
  
  document.addEventListener('click', e => {
    if (!e.target.closest('.export-dropdown')) {
      if (el.exportMenu) el.exportMenu.classList.remove('show');
    }
  });
  
  // Export Actions
  el.downloadFilteredJson.addEventListener('click', () => {
    el.exportMenu.classList.remove('show');
    const exportData = {
      metadata: {
        exported_at: new Date().toISOString(),
        filter_count: state.filteredProblems.length,
        total_in_source: state.allProblems.length,
        active_filters: {
          ...state.filters,
          techTags: Array.from(state.filters.techTags)
        }
      },
      problem_statements: state.filteredProblems.map(formatProblemForExport)
    };
    downloadJSON(exportData, `sih2026_filtered_${state.filteredProblems.length}_statements.json`);
  });
  
  el.downloadFilteredCsv.addEventListener('click', () => {
    el.exportMenu.classList.remove('show');
    downloadCSV(state.filteredProblems, `sih2026_filtered_${state.filteredProblems.length}_statements.csv`);
  });
  
  el.downloadSelectedJson.addEventListener('click', () => {
    el.exportMenu.classList.remove('show');
    const selected = state.allProblems.filter(p => state.selectedIds.has(p.id));
    if (selected.length === 0) {
      showToast('No statements selected', 'error');
      return;
    }
    const exportData = {
      metadata: {
        exported_at: new Date().toISOString(),
        selected_count: selected.length
      },
      problem_statements: selected.map(formatProblemForExport)
    };
    downloadJSON(exportData, `sih2026_selected_${selected.length}_statements.json`);
  });
  
  el.downloadSelectedCsv.addEventListener('click', () => {
    el.exportMenu.classList.remove('show');
    const selected = state.allProblems.filter(p => state.selectedIds.has(p.id));
    if (selected.length === 0) {
      showToast('No statements selected', 'error');
      return;
    }
    downloadCSV(selected, `sih2026_selected_${selected.length}_statements.csv`);
  });
  
  el.copyJsonClipboard.addEventListener('click', async () => {
    el.exportMenu.classList.remove('show');
    try {
      const formatted = state.filteredProblems.map(formatProblemForExport);
      await navigator.clipboard.writeText(JSON.stringify(formatted, null, 2));
      showToast(`Copied ${state.filteredProblems.length} items to clipboard!`, 'success');
    } catch (err) {
      showToast('Clipboard access denied', 'error');
    }
  });
  
  // Modal Actions
  el.closeModalBtn.addEventListener('click', closeDetailModal);
  el.modalCloseActionBtn.addEventListener('click', closeDetailModal);
  el.detailModalBackdrop.addEventListener('click', e => {
    if (e.target === el.detailModalBackdrop) closeDetailModal();
  });
  
  // Modal Tabs
  document.querySelectorAll('.flat-tab-btn').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.flat-tab-btn').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      
      tab.classList.add('active');
      const targetId = `tab-${tab.dataset.tab}`;
      const pane = document.getElementById(targetId);
      if (pane) pane.classList.add('active');
    });
  });
  
  // Modal Copy as Markdown
  el.copyModalMdBtn.addEventListener('click', async () => {
    if (!state.activeModalProblem) return;
    try {
      const mdContent = generateProblemMarkdown(state.activeModalProblem);
      await navigator.clipboard.writeText(mdContent);
      showToast(`Copied ${state.activeModalProblem.id} as Markdown!`, 'success');
      
      const originalHtml = el.copyModalMdBtn.innerHTML;
      el.copyModalMdBtn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; vertical-align: -1px; color: #10B981;">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span style="color: #10B981;">Copied!</span>
      `;
      setTimeout(() => {
        el.copyModalMdBtn.innerHTML = originalHtml;
      }, 2000);
    } catch (err) {
      showToast('Clipboard copy failed', 'error');
    }
  });
  
  // Modal Bookmark
  el.modalFavoriteBtn.addEventListener('click', () => {
    if (!state.activeModalProblem) return;
    toggleBookmark(state.activeModalProblem.id);
    const isFav = state.bookmarkedIds.has(state.activeModalProblem.id);
    el.modalFavoriteBtn.textContent = isFav ? '★ Bookmarked' : '☆ Bookmark';
  });
  
  // Keyboard Shortcuts
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeDetailModal();
      closeMobileDrawer();
    }
    if (e.key === '/' && document.activeElement !== el.searchInput) {
      e.preventDefault();
      el.searchInput.focus();
    }
  });
}

// Run App Initialization
document.addEventListener('DOMContentLoaded', init);
