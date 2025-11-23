// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAus4l8tm2seN3vCT5kzrFxGaEyNr9EDoc",
  authDomain: "dbwa-c097c.firebaseapp.com",
  databaseURL: "https://dbwa-c097c-default-rtdb.firebaseio.com",
  projectId: "dbwa-c097c",
  storageBucket: "dbwa-c097c.appspot.com",
  messagingSenderId: "948107828225",
  appId: "1:948107828225:web:745dcb591b45eb5788b400",
  measurementId: "G-3HL7KDGJFX"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Database References
const articlesRef = database.ref('articles');
const categoriesRef = database.ref('categories');
const commentsRef = database.ref('comments');
const usersRef = database.ref('users');




// Utility Functions
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const createSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
};

const uploadToStorage = async (file, path) => {
    try {
        const fileRef = storageRef.child(path);
        const snapshot = await fileRef.put(file);
        const downloadURL = await snapshot.ref.getDownloadURL();
        return { success: true, url: downloadURL };
    } catch (error) {
        console.error('Error uploading file:', error);
        return { success: false, error: error.message };
    }
};

const optimizeImage = (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
            canvas.width = img.width * ratio;
            canvas.height = img.height * ratio;
            
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(resolve, 'image/jpeg', quality);
        };
        
        img.src = URL.createObjectURL(file);
    });
};

const deleteFromStorage = async (url) => {
    try {
        const fileRef = storage.refFromURL(url);
        await fileRef.delete();
        return { success: true };
    } catch (error) {
        console.error('Error deleting file:', error);
        return { success: false, error: error.message };
    }
};

// Database Schema Functions
const createArticle = async (articleData) => {
    try {
        const id = generateId();
        const slug = createSlug(articleData.title);
        const timestamp = Date.now();
        
        const article = {
            id,
            slug,
            title: articleData.title,
            content: articleData.content,
            excerpt: articleData.excerpt || articleData.content.substring(0, 150) + '...',
            thumbnail: articleData.thumbnail || '',
            category: articleData.category,
            tags: articleData.tags || [],
            author: articleData.author || 'Admin',
            createdAt: timestamp,
            updatedAt: timestamp,
            published: articleData.published || true,
            views: 0
        };
        
        await articlesRef.child(id).set(article);
        
        // Update category count
        if (articleData.category) {
            const categoryRef = categoriesRef.child(articleData.category);
            const categorySnapshot = await categoryRef.once('value');
            const categoryData = categorySnapshot.val() || { name: articleData.category, count: 0 };
            categoryData.count = (categoryData.count || 0) + 1;
            await categoryRef.set(categoryData);
        }
        
        return { success: true, id, slug };
    } catch (error) {
        console.error('Error creating article:', error);
        return { success: false, error: error.message };
    }
};

const updateArticle = async (id, updateData) => {
    try {
        const updates = {
            ...updateData,
            updatedAt: Date.now()
        };
        
        if (updateData.title) {
            updates.slug = createSlug(updateData.title);
        }
        
        await articlesRef.child(id).update(updates);
        return { success: true };
    } catch (error) {
        console.error('Error updating article:', error);
        return { success: false, error: error.message };
    }
};

const deleteArticle = async (id) => {
    try {
        // Get article data first to update category count and delete thumbnail
        const articleSnapshot = await articlesRef.child(id).once('value');
        const article = articleSnapshot.val();
        
        // Delete thumbnail from Storage if exists
        if (article && article.thumbnail && article.thumbnail.includes('firebasestorage.googleapis.com')) {
            await deleteFromStorage(article.thumbnail);
        }
        
        if (article && article.category) {
            const categoryRef = categoriesRef.child(article.category);
            const categorySnapshot = await categoryRef.once('value');
            const categoryData = categorySnapshot.val();
            
            if (categoryData && categoryData.count > 1) {
                categoryData.count -= 1;
                await categoryRef.set(categoryData);
            } else {
                await categoryRef.remove();
            }
        }
        
        // Delete article
        await articlesRef.child(id).remove();
        
        // Delete associated comments
        const commentsSnapshot = await commentsRef.orderByChild('articleId').equalTo(id).once('value');
        const comments = commentsSnapshot.val();
        if (comments) {
            const deletePromises = Object.keys(comments).map(commentId => 
                commentsRef.child(commentId).remove()
            );
            await Promise.all(deletePromises);
        }
        
        return { success: true };
    } catch (error) {
        console.error('Error deleting article:', error);
        return { success: false, error: error.message };
    }
};

const getArticles = async (options = {}) => {
    try {
        const {
            limit = 10,
            offset = 0,
            category = null,
            search = null,
            orderBy = 'createdAt'
        } = options;
        
        let query = articlesRef.orderByChild(orderBy);
        
        if (category && category !== 'all') {
            query = articlesRef.orderByChild('category').equalTo(category);
        }
        
        const snapshot = await query.once('value');
        let articles = [];
        
        snapshot.forEach(childSnapshot => {
            const article = childSnapshot.val();
            if (article.published) {
                articles.push(article);
            }
        });
        
        // Reverse for newest first
        articles.reverse();
        
        // Apply search filter
        if (search) {
            const searchLower = search.toLowerCase();
            articles = articles.filter(article => 
                article.title.toLowerCase().includes(searchLower) ||
                article.content.toLowerCase().includes(searchLower) ||
                article.tags.some(tag => tag.toLowerCase().includes(searchLower))
            );
        }
        
        // Apply pagination
        const total = articles.length;
        const paginatedArticles = articles.slice(offset, offset + limit);
        
        return {
            success: true,
            articles: paginatedArticles,
            total,
            hasMore: offset + limit < total
        };
    } catch (error) {
        console.error('Error getting articles:', error);
        return { success: false, error: error.message };
    }
};

const getArticleById = async (id) => {
    try {
        const snapshot = await articlesRef.child(id).once('value');
        const article = snapshot.val();
        
        if (article) {
            // Increment view count
            await articlesRef.child(id).update({
                views: (article.views || 0) + 1
            });
            
            return { success: true, article: { ...article, views: (article.views || 0) + 1 } };
        } else {
            return { success: false, error: 'Article not found' };
        }
    } catch (error) {
        console.error('Error getting article:', error);
        return { success: false, error: error.message };
    }
};

const getArticleBySlug = async (slug) => {
    try {
        const snapshot = await articlesRef.orderByChild('slug').equalTo(slug).once('value');
        let article = null;
        
        snapshot.forEach(childSnapshot => {
            article = childSnapshot.val();
        });
        
        if (article) {
            // Increment view count
            await articlesRef.child(article.id).update({
                views: (article.views || 0) + 1
            });
            
            return { success: true, article: { ...article, views: (article.views || 0) + 1 } };
        } else {
            return { success: false, error: 'Article not found' };
        }
    } catch (error) {
        console.error('Error getting article by slug:', error);
        return { success: false, error: error.message };
    }
};

const getCategories = async () => {
    try {
        const snapshot = await categoriesRef.once('value');
        const categories = [];
        
        snapshot.forEach(childSnapshot => {
            categories.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        
        return { success: true, categories };
    } catch (error) {
        console.error('Error getting categories:', error);
        return { success: false, error: error.message };
    }
};

const addComment = async (commentData) => {
    try {
        const id = generateId();
        const comment = {
            id,
            articleId: commentData.articleId,
            author: commentData.author,
            content: commentData.content,
            createdAt: Date.now(),
            approved: false // Comments need approval
        };
        
        await commentsRef.child(id).set(comment);
        return { success: true, id };
    } catch (error) {
        console.error('Error adding comment:', error);
        return { success: false, error: error.message };
    }
};

const getComments = async (articleId) => {
    try {
        const snapshot = await commentsRef
            .orderByChild('articleId')
            .equalTo(articleId)
            .once('value');
        
        const comments = [];
        snapshot.forEach(childSnapshot => {
            const comment = childSnapshot.val();
            if (comment.approved) {
                comments.push(comment);
            }
        });
        
        // Sort by creation date
        comments.sort((a, b) => a.createdAt - b.createdAt);
        
        return { success: true, comments };
    } catch (error) {
        console.error('Error getting comments:', error);
        return { success: false, error: error.message };
    }
};

const getLatestArticles = async (limit = 5, excludeId = null) => {
    try {
        const snapshot = await articlesRef.orderByChild('createdAt').once('value');
        const articles = [];
        
        snapshot.forEach(childSnapshot => {
            const article = childSnapshot.val();
            if (article.published && article.id !== excludeId) {
                articles.push(article);
            }
        });
        
        // Sort by newest first and limit
        articles.sort((a, b) => b.createdAt - a.createdAt);
        const latestArticles = articles.slice(0, limit);
        
        return { success: true, articles: latestArticles };
    } catch (error) {
        console.error('Error getting latest articles:', error);
        return { success: false, error: error.message };
    }
};