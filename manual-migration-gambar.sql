-- Manual Migration: Update kolom gambar dari VARCHAR(255) ke LONGTEXT
-- Jalankan di MySQL untuk menyimpan base64 images

-- Backup data gambar yang sudah ada (optional)
-- CREATE TABLE alat_backup_gambar AS SELECT id_alat, gambar FROM alat WHERE gambar IS NOT NULL;

-- Ubah kolom gambar ke LONGTEXT untuk menampung base64
ALTER TABLE `alat` MODIFY COLUMN `gambar` LONGTEXT DEFAULT NULL;

-- Verifikasi
DESCRIBE `alat`;

-- Sukses! Sekarang kolom gambar bisa menyimpan base64 images yang panjang
