# Setup Instructions - BBlog dengan Firebase Storage

## 🔧 Setup Firebase Storage

### 1. Aktifkan Firebase Storage
1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Pilih project `dbwa-c097c`
3. Klik **Storage** di menu kiri
4. Klik **Get Started**
5. Pilih lokasi server (pilih yang terdekat dengan user Anda)
6. Klik **Done**

### 2. Upload Storage Rules
1. Di Firebase Console → Storage → Rules
2. Replace rules dengan kode berikut:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow read access to all files
    match /{allPaths=**} {
      allow read: if true;
    }
    
    // Allow write access to thumbnails folder for authenticated users
    match /thumbnails/{fileName} {
      allow write: if request.auth != null
                   && resource == null
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
    
    // Allow delete access to thumbnails for authenticated users
    match /thumbnails/{fileName} {
      allow delete: if request.auth != null;
    }
  }
}
```

3. Klik **Publish**

### 3. Setup Authentication (Untuk Admin)
1. Di Firebase Console → Authentication
2. Klik **Get Started**
3. Pilih **Sign-in method**
4. Enable **Email/Password**
5. Buat user admin:
   - Email: `admin@bblog.com`
   - Password: `admin123` (ganti dengan password yang aman)

### 4. Import Sample Data (Opsional)
1. Di Firebase Console → Realtime Database
2. Klik **Import JSON**
3. Upload file `sample-data.json`

### 5. Test Website
1. Buka `index.html` di browser
2. Akses `admin/index.html` untuk dashboard admin
3. Test upload gambar di form artikel

## ✅ Troubleshooting

### Error: firebase.storage is not a function
- Pastikan script Firebase Storage sudah ditambahkan di semua halaman HTML
- Cek urutan loading script (app → database → storage → config)

### Error: getArticles is not defined
- Pastikan `firebase-config.js` dimuat sebelum `blog.js`
- Cek console untuk error loading script

### Upload gambar gagal
- Pastikan Firebase Storage sudah diaktifkan
- Cek Storage Rules sudah di-publish
- Pastikan user sudah login (untuk admin)

## 🚀 Fitur yang Sudah Aktif

- ✅ Firebase Realtime Database
- ✅ Firebase Storage untuk gambar
- ✅ CRUD artikel lengkap
- ✅ Sistem komentar dengan moderasi
- ✅ Kategori dan tags
- ✅ Search dan filter
- ✅ Pagination
- ✅ SEO-friendly URLs
- ✅ Responsive design
- ✅ Admin dashboard

## 📝 Cara Menambah Artikel

1. Buka `admin/index.html`
2. Klik **Tambah Artikel**
3. Isi form:
   - Judul artikel
   - Pilih kategori
   - Tambah tags (pisah dengan koma)
   - Upload thumbnail (opsional)
   - Tulis ringkasan
   - Tulis konten lengkap
4. Klik **Simpan Artikel**

Gambar akan otomatis diupload ke Firebase Storage dan URL-nya disimpan di database.