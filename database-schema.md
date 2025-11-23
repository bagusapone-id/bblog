# Firebase Realtime Database Schema - BBlog

## Struktur Database

```
bblog-database/
├── articles/
│   └── {articleId}/
│       ├── id: string
│       ├── slug: string (SEO-friendly URL)
│       ├── title: string
│       ├── content: string (HTML content)
│       ├── excerpt: string (ringkasan artikel)
│       ├── thumbnail: string (base64 atau URL gambar)
│       ├── category: string (ID kategori)
│       ├── tags: array of strings
│       ├── author: string
│       ├── createdAt: number (timestamp)
│       ├── updatedAt: number (timestamp)
│       ├── published: boolean
│       └── views: number
│
├── categories/
│   └── {categoryId}/
│       ├── name: string
│       └── count: number (jumlah artikel dalam kategori)
│
├── comments/
│   └── {commentId}/
│       ├── id: string
│       ├── articleId: string (referensi ke artikel)
│       ├── author: string (nama komentator)
│       ├── email: string
│       ├── content: string
│       ├── createdAt: number (timestamp)
│       └── approved: boolean (moderasi komentar)
│
└── users/
    └── {userId}/
        ├── id: string
        ├── email: string
        ├── name: string
        ├── role: string (admin/editor)
        └── createdAt: number (timestamp)
```

## Contoh Data

### Article
```json
{
  "articles": {
    "1703123456789abc": {
      "id": "1703123456789abc",
      "slug": "cara-membuat-website-blog-dengan-firebase",
      "title": "Cara Membuat Website Blog dengan Firebase",
      "content": "<p>Firebase adalah platform...</p>",
      "excerpt": "Pelajari cara membuat website blog modern menggunakan Firebase Realtime Database...",
      "thumbnail": "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
      "category": "teknologi",
      "tags": ["firebase", "web-development", "javascript"],
      "author": "Admin",
      "createdAt": 1703123456789,
      "updatedAt": 1703123456789,
      "published": true,
      "views": 150
    }
  }
}
```

### Category
```json
{
  "categories": {
    "teknologi": {
      "name": "Teknologi",
      "count": 25
    },
    "programming": {
      "name": "Programming",
      "count": 18
    }
  }
}
```

### Comment
```json
{
  "comments": {
    "1703123456789def": {
      "id": "1703123456789def",
      "articleId": "1703123456789abc",
      "author": "John Doe",
      "email": "john@example.com",
      "content": "Artikel yang sangat bermanfaat! Terima kasih telah berbagi.",
      "createdAt": 1703123456789,
      "approved": true
    }
  }
}
```

### User
```json
{
  "users": {
    "admin123": {
      "id": "admin123",
      "email": "admin@bblog.com",
      "name": "Administrator",
      "role": "admin",
      "createdAt": 1703123456789
    }
  }
}
```

## Indeks untuk Query Optimization

Untuk performa yang optimal, buat indeks berikut di Firebase Console:

1. **articles**
   - `category` (untuk filter berdasarkan kategori)
   - `published` (untuk filter artikel yang dipublikasi)
   - `createdAt` (untuk sorting berdasarkan tanggal)
   - `slug` (untuk pencarian artikel berdasarkan slug)

2. **comments**
   - `articleId` (untuk mengambil komentar per artikel)
   - `approved` (untuk filter komentar yang disetujui)
   - `createdAt` (untuk sorting komentar)

## Security Rules

Rules keamanan sudah didefinisikan dalam file `firebase-rules.json`:

- **Articles**: Read public, Write hanya untuk authenticated users
- **Categories**: Read public, Write hanya untuk authenticated users  
- **Comments**: Read public, Write public (dengan validasi)
- **Users**: Read/Write hanya untuk authenticated users

## Backup Strategy

1. **Automated Backup**: Gunakan Firebase Functions untuk backup otomatis harian
2. **Export Data**: Gunakan Firebase CLI untuk export data secara berkala
3. **Version Control**: Simpan backup rules dan schema di Git

## Performance Tips

1. **Pagination**: Gunakan `limitToFirst()` dan `startAt()` untuk pagination
2. **Indexing**: Pastikan semua query menggunakan indeks yang tepat
3. **Denormalization**: Simpan data yang sering diakses secara redundan
4. **Caching**: Implementasi caching di frontend untuk data yang jarang berubah