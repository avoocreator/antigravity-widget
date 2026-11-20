# Antigravity Desktop Widget (Windows 11)

Widget desktop interaktif bergaya **dark frosted glassmorphism** untuk memantau status automasi dan task Google Antigravity secara real-time.

Dirancang khusus untuk menemani desktop Windows kamu (posisi di sisi kanan, selaras dengan wallpaper minimalis tanpa menabrak jam utama).

---

## Fitur Utama

1. **Sedang Berjalan (Running Tasks)**:
   - Memantau task yang sedang diproses agen secara real-time dari database SQLite Antigravity.
   - Dilengkapi indikator langkah aktif dan animasi progress bar.
2. **Perlu Tindakan (Action Required)**:
   - Kartu peringatan beraksen amber untuk task yang membutuhkan approval (misal konfirmasi commit/push, persetujuan aksi kritis).
   - Tombol satu klik: **Setujui** (`✓`) dan **Tolak** (`✕`).
3. **Jadwal Berikutnya (Upcoming / Scheduled)**:
   - Menampilkan daftar automasi cron terjadwal dari Antigravity sidecars.
   - Dilengkapi jadwal jam dan hitung mundur relatif (*"dalam 6 jam"*).
4. **Selesai (24 Jam Terakhir)**:
   - Task yang selesai dalam 24 jam terakhir otomatis muncul di sini.
   - **Auto-Expire**: Lewat dari 24 jam, task otomatis hilang dari deck utama agar tetap bersih.
   - **Riwayat Lengkap**: Tombol *"Lihat Riwayat Lengkap"* untuk membuka modal pencarian seluruh riwayat task sebelumnya (bisa ditutup dengan tombol `ESC`).
5. **Pill Header**:
   - Status agen (*Agent Active* dengan pulsing indicator / *Standby*).
   - Jam digital real-time.
   - Tombol refresh, minimize ke taskbar, dan close.

---

## Cara Menjalankan

### Mode Standar (CLI)
```bash
npm start
```

### Mode Senyap (Silent Background)
Cukup double click file:
```
launch-widget.vbs
```
Widget akan langsung muncul di pojok kanan desktop tanpa jendela terminal hitam.

### Mode Development
```bash
npm run dev
```

---

## Struktur File
* `electron/main.ts`: Electron window manager (frameless, transparent, posisikan di sisi kanan layar desktop) dan handler IPC.
* `electron/db-reader.js`: Script query native Node v24 `node:sqlite` membaca `~/.gemini/antigravity/conversation_summaries.db`.
* `electron/preload.ts`: Bridge IPC aman antara Electron dan React.
* `src/components/`:
  * `Header.tsx`: Pill header status agen dan kontrol window.
  * `RunningSection.tsx`: Task aktif.
  * `ActionRequiredSection.tsx`: Task yang menunggu tindakan user.
  * `ScheduledSection.tsx`: Task terjadwal / cron.
  * `CompletedSection.tsx`: Task selesai dalam 24 jam terakhir.
  * `HistoryModal.tsx`: Modal pencarian riwayat lengkap.
* `src/App.tsx`: Layout container frosted glass utama.
