# BBlog - Website Blog dengan Firebase Realtime Database

Website blog modern dan responsive yang dibangun dengan HTML, CSS, JavaScript, dan Firebase Realtime Database sebagai backend.

## 🚀 Fitur Utama

- ✅ **Sistem Posting Artikel** - CRUD lengkap (Create, Read, Update, Delete)
- ✅ **Kategori & Tag** - Organisasi konten yang terstruktur
- ✅ **Halaman Artikel** - Layout lengkap dengan thumbnail dan metadata
- ✅ **Search & Filter** - Pencarian artikel dan filter berdasarkan kategori
- ✅ **Sistem Komentar** - Komentar dengan moderasi admin
- ✅ **Dashboard Admin** - Panel administrasi lengkap
- ✅ **SEO-Friendly URL** - URL yang ramah mesin pencari
- ✅ **Responsive Design** - Tampilan optimal di semua perangkat
- ✅ **Optimasi Gambar** - Kompresi otomatis thumbnail
- ✅ **Pagination** - Navigasi halaman yang efisien

## 📁 Struktur Project

```
BBlog/
├── index.html              # Halaman utama
├── pages/
│   └── article.html        # Halaman artikel individual
├── admin/
│   └── index.html          # Dashboard admin
├── assets/
│   └── css/
│       ├── style.css       # Stylesheet utama
│       └── admin.css       # Stylesheet admin
├── js/
│   ├── firebase-config.js  # Konfigurasi Firebase
│   ├── blog.js            # Logika frontend blog
│   ├── article.js         # Logika halaman artikel
│   └── admin.js           # Logika admin dashboard
├── firebase-rules.json     # Rules keamanan Firebase
├── database-schema.md      # Dokumentasi schema database
└── README.md              # Dokumentasi project
```

## 🛠️ Setup & Instalasi

### 1. Setup Firebase Project

1. Buat project baru di [Firebase Console](https://console.firebase.google.com/)
2. Aktifkan **Realtime Database**
3. Salin konfigurasi Firebase dari Project Settings

### 2. Konfigurasi Firebase

Edit file `js/firebase-config.js` dan ganti dengan konfigurasi Firebase Anda:

```javascript
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com/",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};
```

### 3. Setup Database Rules

1. Buka Firebase Console → Realtime Database → Rules
2. Copy-paste isi file `firebase-rules.json`
3. Publish rules

### 4. Deploy Website

#### Option A: Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

#### Option B: Netlify
1. Drag & drop folder project ke Netlify
2. Website langsung live

#### Option C: Vercel
```bash
npm install -g vercel
vercel
```

## 📊 Database Schema

### Articles
```javascript
{
  id: string,
  slug: string,
  title: string,
  content: string,
  excerpt: string,
  thumbnail: string,
  category: string,
  tags: array,
  author: string,
  createdAt: number,
  updatedAt: number,
  published: boolean,
  views: number
}
```

### Categories
```javascript
{
  name: string,
  count: number
}
```

### Comments
```javascript
{
  id: string,
  articleId: string,
  author: string,
  email: string,
  content: string,
  createdAt: number,
  approved: boolean
}
```

## 🎨 Customization

### Mengubah Tema Warna
Edit variabel CSS di `assets/css/style.css`:
```css
:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --success-color: #28a745;
  --danger-color: #dc3545;
}
```

### Menambah Kategori Default
Edit fungsi `loadCategories()` di `js/admin.js` untuk menambah kategori default.

### Custom SEO Meta Tags
Edit bagian `<head>` di setiap halaman HTML untuk SEO yang lebih baik.

## 🔧 API Functions

### Artikel
- `createArticle(articleData)` - Membuat artikel baru
- `updateArticle(id, updateData)` - Update artikel
- `deleteArticle(id)` - Hapus artikel
- `getArticles(options)` - Ambil daftar artikel
- `getArticleById(id)` - Ambil artikel berdasarkan ID
- `getArticleBySlug(slug)` - Ambil artikel berdasarkan slug

### Kategori
- `getCategories()` - Ambil semua kategori

### Komentar
- `addComment(commentData)` - Tambah komentar
- `getComments(articleId)` - Ambil komentar artikel

## 🚀 Performance Optimization

### 1. Image Optimization
- Gambar otomatis dikompres saat upload
- Lazy loading untuk thumbnail
- WebP format support

### 2. Database Optimization
- Pagination untuk artikel
- Indexing pada field yang sering di-query
- Denormalisasi data untuk performa

### 3. Caching Strategy
- Browser caching untuk assets
- Service Worker untuk offline support
- CDN untuk static files

## 🔒 Security Features

### Database Rules
- Read public untuk artikel dan kategori
- Write hanya untuk authenticated users
- Validasi data input
- Rate limiting untuk komentar

### Content Security
- XSS protection
- Input sanitization
- File upload validation
- Comment moderation

## 📱 Browser Support

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ Mobile browsers

## 🐛 Troubleshooting

### Firebase Connection Issues
1. Pastikan konfigurasi Firebase benar
2. Check network connectivity
3. Verify database rules

### Performance Issues
1. Enable browser caching
2. Optimize images
3. Use CDN for assets

### SEO Issues
1. Add proper meta tags
2. Implement structured data
3. Create XML sitemap

## 📄 License

MIT License - bebas digunakan untuk project personal maupun komersial.

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📞 Support

Jika ada pertanyaan atau issue, silakan buat issue di GitHub repository atau hubungi developer.

---

**Happy Blogging! 🎉**