// Article Page Logic
// Helper URL cantik dan parser path
const isLocal = /localhost|127\.0\.0\.1/.test(window.location.host);
function buildArticleURL(category, slug) {
    return isLocal ? `pages/article.html?slug=${slug}` : `/pages/${category}/${slug}`;
}
function buildCategoryURL(category) {
    return isLocal ? `index.html?category=${category}` : `/pages/${category}`;
}
function getCurrentCategoryFromPath() {
    const path = window.location.pathname;
    const m = path.match(/^\/pages\/([^\/]+)/);
    if (m && m[1]) return m[1];
    const params = new URLSearchParams(window.location.search);
    const q = params.get('category');
    return q ? q : 'all';
}
function getSlugFromURL() {
    const path = window.location.pathname;
    const m = path.match(/^\/pages\/([^\/]+)\/([^\/]+)/);
    if (m && m[2]) return m[2];
    const params = new URLSearchParams(window.location.search);
    return params.get('slug');
}

document.addEventListener('DOMContentLoaded', () => {
    const slug = getSlugFromURL();
    if (slug) {
        loadArticle(slug);
    } else {
        showError('Artikel tidak ditemukan');
    }
});

// Heroicons inline SVG helpers
const HI = {
  calendar: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 8V6m12 2V6M4.5 9.75h15M5.25 6h13.5a1.5 1.5 0 011.5 1.5v11.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V7.5A1.5 1.5 0 015.25 6z"/></svg>`,
  user: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.5 19.5a7.5 7.5 0 0115 0v.75H4.5v-.75z"/></svg>`,
  eye: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.25 12c1.5-4.5 6-7.5 9.75-7.5s8.25 3 9.75 7.5c-1.5 4.5-6 7.5-9.75 7.5s-8.25-3-9.75-7.5z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15a3 3 0 100-6 3 3 0 000 6z"/></svg>`,
  paperAirplane: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6.75 12l13.5-6.75-6.75 13.5-2.25-4.5-4.5-2.25z"/></svg>`,
  comments: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7.5 8.25h9m-9 3h6m-9 6.75V6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v7.5A2.25 2.25 0 0118.75 16.5H8.25L6 18.75z"/></svg>`,
  arrowLeft: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.75 19.5l-7.5-7.5 7.5-7.5"/></svg>`
};

// Load and display article
const loadArticle = async (slug) => {
    const container = document.getElementById('articleContainer');
    if (!container) return;
    
    const result = await getArticleBySlug(slug);
    
    if (result.success) {
        displayArticle(result.article);
        loadComments(result.article.id);
        updateSEO(result.article);
    } else {
        showError('Artikel tidak ditemukan');
    }
};

// Load latest articles for sidebar
const loadLatestArticles = async (excludeId) => {
    const container = document.getElementById('latestArticlesContainer');
    if (!container) return;
    
    const result = await getLatestArticles(5, excludeId);
    
    if (result.success && result.articles.length > 0) {
        displayLatestArticles(result.articles);
    } else {
        container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">Tidak ada artikel lain</div>';
    }
};

// Display latest articles
const displayLatestArticles = (articles) => {
    const container = document.getElementById('latestArticlesContainer');
    if (!container) return;
    
    const articlesHtml = articles.map(article => `
        <div class="widget-item" onclick="window.location.href=buildArticleURL('${article.category}','${article.slug}')">
            <div style="font-size: 0.7rem; background: #3498db; color: white; padding: 2px 6px; margin-bottom: 5px; display: inline-block;">${article.category}</div>
            <div style="font-size: 0.9rem; font-weight: 600; color: #333; margin-bottom: 5px; line-height: 1.3;">${article.title}</div>
            <div style="font-size: 0.75rem; color: #7f8c8d;">
                ${HI.calendar} ${formatDate(article.createdAt)}
            </div>
        </div>
    `).join('');
    
    container.innerHTML = articlesHtml;
};

// Display article content
const displayArticle = (article) => {
    const container = document.getElementById('articleContainer');
    if (!container) return;
    
    container.innerHTML = `
        <section class="articles-section">
            <div class="article-header">
                <span class="article-category">${article.category}</span>
                <h1>${article.title}</h1>
                <div class="article-meta">
                    <span class="article-date">
                        ${HI.calendar}
                        ${formatDate(article.createdAt)}
                    </span>
                    <span class="article-author">
                        ${HI.user}
                        ${article.author}
                    </span>
                    <span class="article-views">
                        ${HI.eye}
                        ${article.views || 0} views
                    </span>
                </div>
            </div>
            
            ${article.thumbnail ? `
                <div class="article-image">
                    <img src="${article.thumbnail}" alt="${article.title}" style="max-width: 100%; height: auto;">
                </div>
            ` : ''}
            
            <div class="article-body">
                ${formatArticleContent(article.content)}
            </div>
            
            <div class="article-tags" style="padding: 1rem 0; border-top: 1px solid #eee;">
                <strong>Tags: </strong>
                ${article.tags ? article.tags.map(tag => `
                    <span style="background: #f8f9fa; padding: 0.25rem 0.5rem; border-radius: 15px; margin-right: 0.5rem; font-size: 0.8rem;">
                        ${tag}
                    </span>
                `).join('') : 'Tidak ada tag'}
            </div>
            
            <div class="comments-section">
                <h3>Komentar</h3>
                
                <div class="comment-form">
                    <h4>Tinggalkan Komentar</h4>
                    <form onsubmit="submitComment(event, '${article.id}')">
                        <input type="text" id="commentAuthor" placeholder="Nama Anda" required>
                        <textarea id="commentContent" placeholder="Tulis komentar Anda..." required></textarea>
                        <button type="submit">${HI.paperAirplane} Kirim Komentar</button>
                    </form>
                </div>
                
                <div class="comments-list">
                    <div id="commentsContainer">
                        <div class="loading">Memuat komentar...</div>
                    </div>
                </div>
            </div>
        </section>
        
        <aside class="sidebar">
            <div class="widget">
                <h3>Kategori Populer</h3>
                <div id="popularCategories">
                    <div class="loading">Memuat kategori...</div>
                </div>
            </div>
            <div class="widget" id="latest-articles">
                 <h3>Artikel Terbaru</h3>
                 <div id="latestArticlesContainer">
                     <div class="loading">Memuat artikel terbaru...</div>
                 </div>
             </div>
        </aside>
    `;
    
    // Load latest articles
    loadLatestArticles(article.id);
    // Load popular categories
    loadPopularCategories();
};

// Format article content (use HTML directly from Quill)
const formatArticleContent = (content) => {
    return content;
};

// Update SEO meta tags
const updateSEO = (article) => {
    document.title = `${article.title} - BBlog`;
    
    const description = document.getElementById('articleDescription');
    if (description) {
        description.setAttribute('content', article.excerpt);
    }
    
    // Add Open Graph meta tags
    const head = document.head;
    
    // Remove existing OG tags
    const existingOGTags = head.querySelectorAll('meta[property^="og:"]');
    existingOGTags.forEach(tag => tag.remove());
    
    // Add new OG tags
    const ogTags = [
        { property: 'og:title', content: article.title },
        { property: 'og:description', content: article.excerpt },
        { property: 'og:type', content: 'article' },
        { property: 'og:url', content: window.location.href },
        { property: 'og:image', content: article.thumbnail || '' }
    ];
    
    ogTags.forEach(tag => {
        const meta = document.createElement('meta');
        meta.setAttribute('property', tag.property);
        meta.setAttribute('content', tag.content);
        head.appendChild(meta);
    });
};

// Load and display comments
const loadComments = async (articleId) => {
    const container = document.getElementById('commentsContainer');
    if (!container) return;
    
    const result = await getComments(articleId);
    
    if (result.success) {
        displayComments(result.comments);
    } else {
        container.innerHTML = '<div class="loading">Gagal memuat komentar</div>';
    }
};

// Display comments
const displayComments = (comments) => {
    const container = document.getElementById('commentsContainer');
    if (!container) return;
    
    if (comments.length === 0) {
        container.innerHTML = '<div class="no-comments">Belum ada komentar. Jadilah yang pertama berkomentar!</div>';
        return;
    }
    
    const commentsHtml = `
        <div class="comments-count">
            ${HI.comments} ${comments.length} Komentar
        </div>
        ${comments.map(comment => `
            <div class="comment">
                <div class="comment-header">
                    <div class="comment-author">${comment.author}</div>
                </div>
                <div class="comment-text">${comment.content.replace(/\n/g, '<br>')}</div>
                <div class="comment-date">
                    ${formatDate(comment.createdAt)}
                </div>
            </div>
        `).join('')}
    `;
    
    container.innerHTML = commentsHtml;
};

// Submit comment
const submitComment = async (event, articleId) => {
    event.preventDefault();
    
    const author = document.getElementById('commentAuthor').value;
    const content = document.getElementById('commentContent').value;
    
    if (!author || !content) {
        alert('Nama dan komentar harus diisi');
        return;
    }
    
    const commentData = {
        articleId,
        author,
        content
    };
    
    const result = await addComment(commentData);
    
    if (result.success) {
        alert('Komentar berhasil dikirim dan menunggu persetujuan admin');
        
        // Clear form
        document.getElementById('commentAuthor').value = '';
        document.getElementById('commentContent').value = '';
    } else {
        alert('Gagal mengirim komentar: ' + result.error);
    }
};

// Show error message
const showError = (message) => {
    const container = document.getElementById('articleContainer');
    if (!container) return;
    
    container.innerHTML = `
        <section class="articles-section">
            <div style="text-align: center; padding: 3rem;">
                <h2>Oops!</h2>
                <p>${message}</p>
                <a href="../index.html" style="color: #007bff; text-decoration: none;">
                    ${HI.arrowLeft} Kembali ke Beranda
                </a>
            </div>
        </section>
        
        <aside class="sidebar">
            <div class="widget">
                <h3>Kategori Populer</h3>
                <div id="popularCategories">
                    <div class="loading">Memuat kategori...</div>
                </div>
            </div>
            <div class="widget">
                <h3>Artikel Terbaru</h3>
                <div id="latestArticlesContainer">
                    <div class="loading">Memuat artikel terbaru...</div>
                </div>
            </div>
        </aside>
    `;
    
    // Load sidebar data even on error
    loadPopularCategories();
    loadLatestArticles();
};

// Toggle mobile menu
const toggleMobileMenu = () => {
    const mobileMenu = document.querySelector('.mobile-menu');
    const overlay = document.querySelector('.mobile-overlay');
    const isOpen = mobileMenu?.classList.contains('show');
    
    if (!isOpen) {
        mobileMenu?.classList.add('show');
        overlay?.classList.add('show');
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

// Search functionality
const openModalSearch = () => {
    const searchModal = document.getElementById('searchModal');
    const searchModalContent = searchModal.querySelector('.search-modal-content');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    
    searchModal.classList.add('show');
    searchModalContent.classList.remove('popup-close');
    searchModalContent.classList.add('popup-open');
    
    loadSearchCategories();
    searchResults.innerHTML = '<div class="search-empty-state">Masukkan kata kunci dan klik tombol cari untuk memulai pencarian</div>';
    
    setTimeout(() => {
        searchInput.focus();
    }, 150);
};

const closeModalSearch = (event) => {
    const searchModal = document.getElementById('searchModal');
    const searchModalContent = searchModal.querySelector('.search-modal-content');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    
    if (!event || event.target === searchModal || event.target.closest('.search-close')) {
        searchModalContent.classList.remove('popup-open');
        searchModalContent.classList.add('popup-close');
        
        searchModalContent.addEventListener('animationend', function hideModal() {
            searchModal.classList.remove('show');
            searchInput.value = '';
            searchResults.innerHTML = '';
            searchModalContent.classList.remove('popup-close');
            searchModalContent.removeEventListener('animationend', hideModal);
        });
    }
};

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
        if (sort === 'oldest') {
            articles = articles.reverse();
        }
        displaySearchResults(articles);
    } else {
        searchResults.innerHTML = '<div class="search-no-results">Tidak ada artikel ditemukan dengan kata kunci "' + query + '"</div>';
    }
};

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

const selectSearchResult = (slug) => {
    const searchModal = document.getElementById('searchModal');
    const searchModalContent = searchModal.querySelector('.search-modal-content');
    
    searchModalContent.classList.remove('popup-open');
    searchModalContent.classList.add('popup-close');
    
    searchModalContent.addEventListener('animationend', function navigateToArticle() {
        searchModal.classList.remove('show');
        searchModalContent.classList.remove('popup-close');
        searchModalContent.removeEventListener('animationend', navigateToArticle);
        window.location.href = buildArticleURL(getCurrentCategoryFromPath(), slug);
    });
};

// Load and display popular categories in article page
const loadPopularCategories = async () => {
    const result = await getCategories();
    if (result.success) {
        displayPopularCategories(result.categories);
    } else {
        const container = document.getElementById('popularCategories');
        if (container) container.innerHTML = '<div class="loading">Gagal memuat kategori</div>';
    }
};

const displayPopularCategories = (categories) => {
    const container = document.getElementById('popularCategories');
    if (!container) return;
    
    const sortedCategories = categories
        .sort((a, b) => (b.count || 0) - (a.count || 0))
        .slice(0, 5);
    
    container.innerHTML = `
        <div class="widget-item" onclick="navigateToCategory('all')">
            Semua Kategori
        </div>
    ` + sortedCategories.map(category => `
        <div class="widget-item" onclick="navigateToCategory('${category.id}')">
            ${category.name} (${category.count || 0})
        </div>
    `).join('');
};

const navigateToCategory = (categoryId) => {
    if (!categoryId || categoryId === 'all') {
        window.location.href = `../index.html`;
    } else {
        window.location.href = `../index.html?category=${categoryId}`;
    }
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
        let html = '';
        html += `<a href=\"../index.html\" onclick=\"toggleMobileMenu(false);\">Semua Kategori</a>`;
        categories.forEach(cat => {
            html += `<a href=\"../index.html?category=${cat.id}\" onclick=\"toggleMobileMenu(false);\">${cat.name}</a>`;
        });
        submenu.innerHTML = html;
    } catch (e) {
        submenu.innerHTML = '<a href=\"../index.html\">Kategori tidak tersedia</a>';
    }
}

function toggleSearch() {
    const searchModal = document.getElementById('searchModal');
    if (!searchModal) return;
    const isOpen = searchModal.classList.contains('show');
    if (isOpen) {
        if (typeof closeModalSearch === 'function') {
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