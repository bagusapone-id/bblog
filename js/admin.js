// Admin Dashboard Logic
let currentEditingId = null;

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardStats();
    loadArticlesTable();
    loadCommentsTable();
    loadCategoriesGrid();
    loadCategoriesSelect();
    setupEventListeners();
    initializeQuillEditor();
});

// Initialize Quill editor
let quillEditor;
const initializeQuillEditor = () => {
    quillEditor = new Quill('#articleContent', {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'font': [] }],
                [{ 'size': ['small', false, 'large', 'huge'] }],
                [{ 'align': [] }],
                ['blockquote', 'code-block'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link', 'image'],
                ['clean']
            ]
        },
        placeholder: 'Tulis konten artikel di sini...'
    });
};

// Setup event listeners
const setupEventListeners = () => {
    const articleForm = document.getElementById('articleForm');
    if (articleForm) {
        articleForm.addEventListener('submit', handleArticleSubmit);
    }
    
    const thumbnailInput = document.getElementById('articleThumbnail');
    if (thumbnailInput) {
        thumbnailInput.addEventListener('change', handleThumbnailPreview);
    }
};

// Show section
const showSection = (sectionId) => {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    document.querySelector(`[onclick="showSection('${sectionId}')"]`)?.classList.add('active');
    
    // Update title
    const titles = {
        'dashboard': 'Dashboard',
        'articles': 'Kelola Artikel',
        'add-article': 'Tambah Artikel',
        'comments': 'Kelola Komentar',
        'categories': 'Kelola Kategori'
    };
    
    document.getElementById('sectionTitle').textContent = titles[sectionId] || 'Admin';
    
    // Load section-specific data
    if (sectionId === 'articles') {
        loadArticlesTable();
    } else if (sectionId === 'comments') {
        loadCommentsTable();
    } else if (sectionId === 'categories') {
        loadCategoriesGrid();
    }
};

// Load dashboard statistics
const loadDashboardStats = async () => {
    try {
        // Get articles
        const articlesResult = await getArticles({ limit: 1000 });
        const totalArticles = articlesResult.success ? articlesResult.total : 0;
        document.getElementById('totalArticles').textContent = totalArticles;
        
        // Calculate total views
        let totalViews = 0;
        if (articlesResult.success) {
            totalViews = articlesResult.articles.reduce((sum, article) => sum + (article.views || 0), 0);
        }
        document.getElementById('totalViews').textContent = totalViews;
        
        // Get categories
        const categoriesResult = await getCategories();
        const totalCategories = categoriesResult.success ? categoriesResult.categories.length : 0;
        document.getElementById('totalCategories').textContent = totalCategories;
        
        // Get comments (simplified - you might want to create a separate function)
        const commentsSnapshot = await commentsRef.once('value');
        const totalComments = commentsSnapshot.numChildren();
        document.getElementById('totalComments').textContent = totalComments;
        
        // Load recent activity
        loadRecentActivity(articlesResult.articles || []);
        
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
};

// Load recent activity
const loadRecentActivity = (articles) => {
    const container = document.getElementById('recentActivity');
    if (!container) return;
    
    const recentArticles = articles
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5);
    
    if (recentArticles.length === 0) {
        container.innerHTML = '<p>Belum ada aktivitas</p>';
        return;
    }
    
    container.innerHTML = recentArticles.map(article => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas fa-plus"></i>
            </div>
            <div class="activity-text">
                Artikel "${article.title}" dipublikasikan
            </div>
            <div class="activity-time">
                ${formatDate(article.createdAt)}
            </div>
        </div>
    `).join('');
};

// Load articles table
const loadArticlesTable = async () => {
    const tbody = document.getElementById('articlesTable');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="6" class="loading">Memuat artikel...</td></tr>';
    
    const result = await getArticles({ limit: 100 });
    
    if (result.success) {
        if (result.articles.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading">Belum ada artikel</td></tr>';
            return;
        }
        
        tbody.innerHTML = result.articles.map(article => `
            <tr>
                <td>
                    <strong>${article.title}</strong><br>
                    <small>${article.excerpt}</small>
                </td>
                <td>${article.category}</td>
                <td>${formatDate(article.createdAt)}</td>
                <td>${article.views || 0}</td>
                <td>
                    <span class="status-badge ${article.published ? 'status-published' : 'status-draft'}">
                        ${article.published ? 'Published' : 'Draft'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editArticle('${article.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteArticleConfirm('${article.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } else {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">Gagal memuat artikel</td></tr>';
    }
};

// Handle article form submission
const handleArticleSubmit = async (event) => {
    event.preventDefault();
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    submitBtn.disabled = true;
    
    try {
        const formData = {
            title: document.getElementById('articleTitle').value,
            category: document.getElementById('articleCategory').value,
            author: document.getElementById('articleAuthor').value || 'Admin',
            tags: document.getElementById('articleTags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
            excerpt: document.getElementById('articleExcerpt').value,
            content: quillEditor.root.innerHTML,
            published: document.getElementById('articlePublished').checked
        };
        
        // Handle thumbnail upload to Firebase Storage
        const thumbnailFile = document.getElementById('articleThumbnail').files[0];
        if (thumbnailFile) {
            const optimizedImage = await optimizeImage(thumbnailFile);
            const fileName = `thumbnails/${Date.now()}_${thumbnailFile.name}`;
            const uploadResult = await uploadToStorage(optimizedImage, fileName);
            
            if (uploadResult.success) {
                formData.thumbnail = uploadResult.url;
            } else {
                throw new Error('Gagal upload gambar: ' + uploadResult.error);
            }
        }
        
        let result;
        if (currentEditingId) {
            result = await updateArticle(currentEditingId, formData);
        } else {
            result = await createArticle(formData);
        }
        
        if (result.success) {
            alert(currentEditingId ? 'Artikel berhasil diperbarui!' : 'Artikel berhasil dibuat!');
            resetArticleForm();
            loadArticlesTable();
            loadDashboardStats();
            showSection('articles');
        } else {
            alert('Gagal menyimpan artikel: ' + result.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
};



// Handle thumbnail preview
const handleThumbnailPreview = (event) => {
    const file = event.target.files[0];
    const preview = document.getElementById('thumbnailPreview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '';
    }
};

// Edit article
const editArticle = async (id) => {
    const result = await getArticleById(id);
    
    if (result.success) {
        const article = result.article;
        
        currentEditingId = id;
        document.getElementById('articleFormTitle').textContent = 'Edit Artikel';
        document.getElementById('articleId').value = id;
        document.getElementById('articleTitle').value = article.title;
        document.getElementById('articleCategory').value = article.category;
        document.getElementById('articleAuthor').value = article.author || 'Admin';
        document.getElementById('articleTags').value = article.tags ? article.tags.join(', ') : '';
        document.getElementById('articleExcerpt').value = article.excerpt;
        quillEditor.root.innerHTML = article.content;
        document.getElementById('articlePublished').checked = article.published;
        
        if (article.thumbnail) {
            document.getElementById('thumbnailPreview').innerHTML = 
                `<img src="${article.thumbnail}" alt="Current thumbnail">`;
        }
        
        showSection('add-article');
    } else {
        alert('Gagal memuat artikel: ' + result.error);
    }
};

// Delete article confirmation
const deleteArticleConfirm = (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus artikel ini?')) {
        deleteArticleById(id);
    }
};

// Delete article
const deleteArticleById = async (id) => {
    const result = await deleteArticle(id);
    
    if (result.success) {
        alert('Artikel berhasil dihapus!');
        loadArticlesTable();
        loadDashboardStats();
    } else {
        alert('Gagal menghapus artikel: ' + result.error);
    }
};

// Reset article form
const resetArticleForm = () => {
    currentEditingId = null;
    document.getElementById('articleFormTitle').textContent = 'Tambah Artikel Baru';
    document.getElementById('articleForm').reset();
    quillEditor.setContents([]);
    document.getElementById('thumbnailPreview').innerHTML = '';
};

// Load comments table
const loadCommentsTable = async () => {
    const tbody = document.getElementById('commentsTable');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="6" class="loading">Memuat komentar...</td></tr>';
    
    try {
        const snapshot = await commentsRef.once('value');
        const comments = [];
        
        snapshot.forEach(childSnapshot => {
            comments.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        
        if (comments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading">Belum ada komentar</td></tr>';
            return;
        }
        
        // Get article titles for comments
        const articlesResult = await getArticles({ limit: 1000 });
        const articlesMap = {};
        if (articlesResult.success) {
            articlesResult.articles.forEach(article => {
                articlesMap[article.id] = article.title;
            });
        }
        
        tbody.innerHTML = comments
            .sort((a, b) => b.createdAt - a.createdAt)
            .map(comment => `
                <tr>
                    <td>
                        <strong>${comment.author}</strong><br>
                        <small>${comment.email}</small>
                    </td>
                    <td>${articlesMap[comment.articleId] || 'Unknown Article'}</td>
                    <td>${comment.content.substring(0, 100)}${comment.content.length > 100 ? '...' : ''}</td>
                    <td>${formatDate(comment.createdAt)}</td>
                    <td>
                        <span class="status-badge ${comment.approved ? 'status-approved' : 'status-pending'}">
                            ${comment.approved ? 'Approved' : 'Pending'}
                        </span>
                    </td>
                    <td>
                        ${!comment.approved ? `
                            <button class="btn btn-sm btn-success" onclick="approveComment('${comment.id}')">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-danger" onclick="deleteCommentConfirm('${comment.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
            
    } catch (error) {
        console.error('Error loading comments:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="loading">Gagal memuat komentar</td></tr>';
    }
};

// Approve comment
const approveComment = async (id) => {
    try {
        await commentsRef.child(id).update({ approved: true });
        alert('Komentar berhasil disetujui!');
        loadCommentsTable();
        loadDashboardStats();
    } catch (error) {
        alert('Gagal menyetujui komentar: ' + error.message);
    }
};

// Delete comment confirmation
const deleteCommentConfirm = (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus komentar ini?')) {
        deleteCommentById(id);
    }
};

// Delete comment
const deleteCommentById = async (id) => {
    try {
        await commentsRef.child(id).remove();
        alert('Komentar berhasil dihapus!');
        loadCommentsTable();
        loadDashboardStats();
    } catch (error) {
        alert('Gagal menghapus komentar: ' + error.message);
    }
};

// Load categories grid
const loadCategoriesGrid = async () => {
    const container = document.getElementById('categoriesGrid');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">Memuat kategori...</div>';
    
    const result = await getCategories();
    
    if (result.success) {
        if (result.categories.length === 0) {
            container.innerHTML = '<div class="loading">Belum ada kategori</div>';
            return;
        }
        
        container.innerHTML = result.categories.map(category => `
            <div class="category-card">
                <div class="category-info">
                    <h4>${category.name}</h4>
                    <p>${category.count || 0} artikel</p>
                </div>
                <div class="category-actions">
                    <button class="btn btn-sm btn-danger" onclick="deleteCategoryConfirm('${category.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    } else {
        container.innerHTML = '<div class="loading">Gagal memuat kategori</div>';
    }
};

// Load categories for select dropdown
const loadCategoriesSelect = async () => {
    const select = document.getElementById('articleCategory');
    if (!select) return;
    
    const result = await getCategories();
    
    if (result.success) {
        const options = result.categories.map(category => 
            `<option value="${category.id}">${category.name}</option>`
        ).join('');
        
        select.innerHTML = '<option value="">Pilih Kategori</option>' + options;
    }
};

// Show add category form
const showAddCategoryForm = () => {
    document.getElementById('addCategoryForm').style.display = 'block';
    document.getElementById('categoryName').focus();
};

// Hide add category form
const hideAddCategoryForm = () => {
    document.getElementById('addCategoryForm').style.display = 'none';
    document.getElementById('categoryName').value = '';
};

// Add category
const addCategory = async (event) => {
    event.preventDefault();
    
    const name = document.getElementById('categoryName').value.trim();
    if (!name) return;
    
    try {
        const id = createSlug(name);
        await categoriesRef.child(id).set({
            name: name,
            count: 0
        });
        
        alert('Kategori berhasil ditambahkan!');
        hideAddCategoryForm();
        loadCategoriesGrid();
        loadCategoriesSelect();
        loadDashboardStats();
    } catch (error) {
        alert('Gagal menambahkan kategori: ' + error.message);
    }
};

// Delete category confirmation
const deleteCategoryConfirm = (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus kategori ini? Artikel dalam kategori ini akan kehilangan kategorinya.')) {
        deleteCategoryById(id);
    }
};

// Delete category
const deleteCategoryById = async (id) => {
    try {
        await categoriesRef.child(id).remove();
        alert('Kategori berhasil dihapus!');
        loadCategoriesGrid();
        loadCategoriesSelect();
        loadDashboardStats();
    } catch (error) {
        alert('Gagal menghapus kategori: ' + error.message);
    }
};