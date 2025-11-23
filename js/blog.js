// Blog Frontend Logic
let currentPage = 1;
let currentCategory = 'all';
let currentSearch = '';
const articlesPerPage = 6;

// Heroicons inline SVG helpers
const HI = {
  calendar: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 8V6m12 2V6M4.5 9.75h15M5.25 6h13.5a1.5 1.5 0 011.5 1.5v11.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V7.5A1.5 1.5 0 015.25 6z"/></svg>`,
  eye: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.25 12c1.5-4.5 6-7.5 9.75-7.5s8.25 3 9.75 7.5c-1.5 4.5-6 7.5-9.75 7.5s-8.25-3-9.75-7.5z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15a3 3 0 100-6 3 3 0 000 6z"/></svg>`
};

// Initialize blog
document.addEventListener('DOMContentLoaded', () => {
    // Read category from URL if present
    const initialCategory = getUrlParameter('category');
    if (initialCategory) {
        currentCategory = initialCategory;
    }

    loadArticles(currentPage, currentCategory, currentSearch);
    loadCategories();
    loadRecentArticles();
    setupEventListeners();
});

// Load categories for search filter
const loadSearchCategories = async () => {
    const result = await getCategories();
    if (result.success) {
        const searchCategory = document.getElementById('searchCategory');
        searchCategory.innerHTML = '<option value="all">Semua Kategori</option>' + 
            result.categories.map(category => `
                <option value="${category.id}">${category.name}</option>
            `).join('');
    }
};

// Setup event listeners
const setupEventListeners = () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            } else if (e.key === 'Escape') {
                closeModalSearch();
            }
        });
    }
    
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const searchModal = document.getElementById('searchModal');
            if (searchModal.classList.contains('show')) {
                closeModalSearch();
            }
        }
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        const mobileMenu = document.getElementById('mobileMenu');
        const menuToggle = document.querySelector('.menu-toggle');
        
        if (mobileMenu && !mobileMenu.contains(e.target) && !menuToggle.contains(e.target)) {
            mobileMenu.classList.remove('show');
        }
    });
};

// Open search modal
const openModalSearch = () => {
    const searchModal = document.getElementById('searchModal');
    const searchModalContent = searchModal.querySelector('.search-modal-content');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    
    searchModal.classList.add('show');
    searchModalContent.classList.remove('popup-close');
    searchModalContent.classList.add('popup-open');
    
    // Load categories for filter
    loadSearchCategories();
    
    // Show empty state
    searchResults.innerHTML = '<div class="search-empty-state">Masukkan kata kunci dan klik tombol cari untuk memulai pencarian</div>';
    
    setTimeout(() => {
        searchInput.focus();
    }, 150);
};

// Close search modal
const closeModalSearch = (event) => {
    const searchModal = document.getElementById('searchModal');
    const searchModalContent = searchModal.querySelector('.search-modal-content');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    
    // Only close if clicking overlay or close button
    if (!event || event.target === searchModal || event.target.closest('.search-close')) {
        searchModalContent.classList.remove('popup-open');
        searchModalContent.classList.add('popup-close');
        
        // Wait for animation to complete before hiding modal
        searchModalContent.addEventListener('animationend', function hideModal() {
            searchModal.classList.remove('show');
            searchInput.value = '';
            searchResults.innerHTML = '';
            searchModalContent.classList.remove('popup-close');
            searchModalContent.removeEventListener('animationend', hideModal);
        });
    }
};

// Load and display articles
const loadArticles = async (page = 1, category = 'all', search = '') => {
    const container = document.getElementById('articlesContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">Memuat artikel...</div>';
    
    const offset = (page - 1) * articlesPerPage;
    const result = await getArticles({
        limit: articlesPerPage,
        offset,
        category: category === 'all' ? null : category,
        search
    });
    
    if (result.success) {
        displayArticles(result.articles);
        setupPagination(result.total, page);
    } else {
        container.innerHTML = '<div class="loading">Gagal memuat artikel</div>';
    }
};

// Display articles in grid
const displayArticles = (articles) => {
    const container = document.getElementById('articlesContainer');
    if (!container) return;
    
    if (articles.length === 0) {
        container.innerHTML = '<div class="loading">Tidak ada artikel ditemukan</div>';
        return;
    }
    
    container.innerHTML = articles.map(article => `
        <article class="article-card" onclick="openArticle('${article.slug}')">
            <img src="${article.thumbnail || 'https://via.placeholder.com/400x200?text=No+Image'}" 
                 alt="${article.title}" class="article-thumbnail" 
                 onerror="this.src='https://via.placeholder.com/400x200?text=No+Image'">
            <div class="article-content">
                <span class="article-category">${article.category}</span>
                <h2 class="article-title">${article.title}</h2>
                <p class="article-excerpt">${article.excerpt}</p>
                <div class="article-meta">
                    <span class="article-date">
                        ${HI.calendar}
                        ${formatDate(article.createdAt)}
                    </span>
                    <span class="article-views">
                        ${HI.eye}
                        ${article.views || 0}
                    </span>
                </div>
            </div>
        </article>
    `).join('');
};

// Setup pagination
const setupPagination = (total, currentPage) => {
    const container = document.getElementById('pagination');
    if (!container) return;
    
    const totalPages = Math.ceil(total / articlesPerPage);
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    if (currentPage > 1) {
        paginationHTML += `<button onclick="changePage(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>`;
    }
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        paginationHTML += `<button onclick="changePage(1)">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span>...</span>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `<button onclick="changePage(${i})" 
            ${i === currentPage ? 'class="active"' : ''}>${i}</button>`;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span>...</span>`;
        }
        paginationHTML += `<button onclick="changePage(${totalPages})">${totalPages}</button>`;
    }
    
    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `<button onclick="changePage(${currentPage + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>`;
    }
    
    container.innerHTML = paginationHTML;
};

// Change page
const changePage = (page) => {
    currentPage = page;
    loadArticles(currentPage, currentCategory, currentSearch);
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Load categories
const loadCategories = async () => {
    const result = await getCategories();
    if (result.success) {
        displayCategories(result.categories);
        displayPopularCategories(result.categories);
    }
};

// Display categories filter
const displayCategories = (categories) => {
    const container = document.getElementById('categoriesList');
    if (!container) return;
    
    container.innerHTML = categories.map(category => `
        <button class="category-btn" onclick="filterByCategory('${category.id}')">
            ${category.name} (${category.count})
        </button>
    `).join('');
};

// Display popular categories in sidebar
const displayPopularCategories = (categories) => {
    const container = document.getElementById('popularCategories');
    if (!container) return;
    
    const sortedCategories = categories
        .sort((a, b) => (b.count || 0) - (a.count || 0))
        .slice(0, 5);
    
    container.innerHTML = `
        <div class="widget-item ${currentCategory === 'all' ? 'active' : ''}" onclick="filterByCategory('all')">
            Semua Kategori
        </div>
    ` + sortedCategories.map(category => `
        <div class="widget-item ${category.id === currentCategory ? 'active' : ''}" onclick="filterByCategory('${category.id}')">
            ${category.name} (${category.count})
        </div>
    `).join('');
};

// Filter by category
const filterByCategory = (category) => {
    currentCategory = category;
    currentPage = 1;
    
    // Update active button if category list exists
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (category === 'all') {
        document.querySelector('.category-btn')?.classList.add('active');
    } else {
        document.querySelector(`[onclick="filterByCategory('${category}')"]`)?.classList.add('active');
    }
    
    // Update URL parameter for category
    updateCategoryParam(category);
    
    loadArticles(currentPage, currentCategory, currentSearch);
};

// Helper: write/remove category in URL (supports pretty path)
const updateCategoryParam = (category) => {
    if (isLocal) {
        const url = new URL(window.location.href);
        if (!category || category === 'all') {
            url.searchParams.delete('category');
        } else {
            url.searchParams.set('category', category);
        }
        window.history.pushState({}, '', url);
    } else {
        const path = !category || category === 'all' ? '/pages' : `/pages/${category}`;
        window.history.pushState({}, '', path);
    }
};

// Perform search
const performSearch = async () => {
    const searchInput = document.getElementById('searchInput');
    const searchCategory = document.getElementById('searchCategory');
    const searchSort = document.getElementById('searchSort');
    const searchResults = document.getElementById('searchResults');
    
    const query = searchInput.value.trim();
    const category = searchCategory.value;
    const sort = searchSort.value;
    
    if (query.length < 2) {
        searchResults.innerHTML = '<div class="search-no-results">Masukkan minimal 2 karakter untuk pencarian</div>';
        return;
    }
    
    searchResults.innerHTML = '<div class="search-no-results">Mencari artikel...</div>';
    
    let orderBy = 'createdAt';
    if (sort === 'popular') orderBy = 'views';
    
    const result = await getArticles({ 
        limit: 20, 
        search: query,
        category: category === 'all' ? null : category,
        orderBy
    });
    
    if (result.success && result.articles.length > 0) {
        let articles = result.articles;
        
        // Sort by oldest if selected
        if (sort === 'oldest') {
            articles = articles.reverse();
        }
        
        displaySearchResults(articles);
    } else {
        searchResults.innerHTML = '<div class="search-no-results">Tidak ada artikel ditemukan dengan kata kunci "' + query + '"</div>';
    }
};

// Display search results in modal
const displaySearchResults = (articles) => {
    const searchResults = document.getElementById('searchResults');
    
    searchResults.innerHTML = articles.map(article => `
        <div class="search-result-item" onclick="selectSearchResult('${article.slug}')">
            <div class="search-result-title">${article.title}</div>
            <div class="search-result-meta">
                <span>${HI.calendar} ${formatDate(article.createdAt)}</span>
            </div>
        </div>
    `).join('');
};

// Select search result
const selectSearchResult = (slug) => {
    const searchModal = document.getElementById('searchModal');
    const searchModalContent = searchModal.querySelector('.search-modal-content');
    
    searchModalContent.classList.remove('popup-open');
    searchModalContent.classList.add('popup-close');
    
    searchModalContent.addEventListener('animationend', function navigateToArticle() {
        searchModal.classList.remove('show');
        searchModalContent.classList.remove('popup-close');
        searchModalContent.removeEventListener('animationend', navigateToArticle);
        openArticle(slug);
    });
};

// Search articles (for main page)
const searchArticles = () => {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    currentSearch = searchInput.value.trim();
    currentPage = 1;
    loadArticles(currentPage, currentCategory, currentSearch);
};

// Load recent articles for sidebar
const loadRecentArticles = async () => {
    const result = await getArticles({ limit: 5 });
    if (result.success) {
        displayRecentArticles(result.articles);
    }
};

// Display recent articles in sidebar
const displayRecentArticles = (articles) => {
    const container = document.getElementById('recentArticles');
    if (!container) return;
    
    container.innerHTML = articles.map(article => `
        <div class="widget-item" onclick="openArticle('${article.slug}')">
            <div style="font-weight: 600; margin-bottom: 0.25rem;">${article.title}</div>
            <div style="font-size: 0.8rem; color: #888;">
                ${formatDate(article.createdAt)}
            </div>
        </div>
    `).join('');
};

// URL builders for prod (Vercel) and local dev
const isLocal = /localhost|127\.0\.0\.1/.test(window.location.host);
const buildArticleURL = (category, slug) => {
    return isLocal ? `pages/article.html?slug=${slug}` : `/pages/${category}/${slug}`;
};
const buildCategoryURL = (category) => {
    return isLocal ? `index.html?category=${category}` : `/pages/${category}`;
};

// Open article page
const openArticle = (slug, category = currentCategory) => {
    window.location.href = buildArticleURL(category || 'all', slug);
};

// Toggle mobile menu
const toggleMobileMenu = () => {
    const mobileMenu = document.querySelector('.mobile-menu');
    const overlay = document.querySelector('.mobile-overlay');
    const isOpen = mobileMenu?.classList.contains('show');

    if (!isOpen) {
        mobileMenu?.classList.add('show');
        overlay?.classList.add('show');
        // close when clicking overlay
        overlay?.addEventListener('click', closeMobileMenuOnce);
    } else {
        closeMobileMenu();
    }
}

function closeMobileMenuOnce() {
    closeMobileMenu();
    const overlay = document.querySelector('.mobile-overlay');
    overlay?.removeEventListener('click', closeMobileMenuOnce);
}

function closeMobileMenu() {
    const mobileMenu = document.querySelector('.mobile-menu');
    const overlay = document.querySelector('.mobile-overlay');
    mobileMenu?.classList.remove('show');
    overlay?.classList.remove('show');
}

// Utility function to get URL parameters
const getUrlParameter = (name) => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
};

function toggleMobileSubmenu(event) {
    event.preventDefault();
    const submenu = document.getElementById('mobileCategoriesSubmenu');
    const toggleLink = event.currentTarget;
    if (!submenu) return;
    submenu.classList.toggle('show');
    toggleLink.classList.toggle('active');
    if (submenu.classList.contains('show')) {
        populateMobileCategoriesSubmenu();
    }
}

async function populateMobileCategoriesSubmenu() {
    const submenu = document.getElementById('mobileCategoriesSubmenu');
    if (!submenu) return;
    try {
        const result = await getCategories();
        const categories = result && result.success ? result.categories : [];
        const currentCategory = getCurrentCategoryFromURL();
        let html = '';
        html += `<a href="#" onclick="filterByCategory('all'); toggleMobileMenu(false); return false;" class="${currentCategory === 'all' ? 'active' : ''}">Semua Kategori</a>`;
        categories.forEach(cat => {
            const active = currentCategory === cat.id ? 'active' : '';
            html += `<a href="#" onclick="filterByCategory('${cat.id}'); toggleMobileMenu(false); return false;" class="${active}">${cat.name}</a>`;
        });
        submenu.innerHTML = html;
    } catch (e) {
        submenu.innerHTML = '<a href="#">Kategori tidak tersedia</a>';
    }
}


function toggleSearch() {
    const searchModal = document.getElementById('searchModal');
    if (!searchModal) return;
    const isOpen = searchModal.classList.contains('show');
    if (isOpen) {
        if (typeof closeModalSearch === 'function') {
            // Simulasikan event agar closeModalSearch mau menutup
            closeModalSearch({ target: searchModal });
        } else {
            searchModal.classList.remove('show');
        }
    } else {
        if (typeof openModalSearch === 'function') {
            openModalSearch();
        } else {
            searchModal.classList.add('show');
        }
    }
}

function getCurrentCategoryFromURL() {
    // Prefer pretty path /pages/:category if present
    const path = window.location.pathname;
    const match = path.match(/^\/pages\/?([^\/]+)?/);
    if (match && match[1]) {
        return match[1];
    }
    // Fallback to query param
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category');
    return cat ? cat : 'all';
}