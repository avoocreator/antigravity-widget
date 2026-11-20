# Antigravity Widget

Widget desktop Windows bergaya frosted glass untuk memantau **sesi chat Antigravity** yang sedang berjalan.
Hidup di system tray, tidak muncul di taskbar, dan latar kacanya memakai wallpaper desktopmu sendiri.

## Isi widget

| Bagian | Sumber |
| --- | --- |
| Kartu utama: sesi yang sedang berjalan, langkah aktif, progress | `conversation_summaries.db` + `brain/<id>/task.md` |
| Perlu tindakan: sesi yang menunggu jawaban/persetujuanmu | status sesi di database |
| Selesai 24 jam terakhir (rail kartu), tombol Riwayat dengan pencarian | database |
| Jadwal otomasi: waktu jalan berikutnya + hitung mundur | `~/.gemini/config/sidecars/*.json` |

Semua dibaca **read-only**. Widget tidak mengubah apa pun milik Antigravity.

## Pasang & jalankan

Syarat: Windows 10/11, Node.js **22.5 atau lebih baru** di PATH (untuk `node:sqlite`).

```bash
npm install
npm run build
npm start          # atau klik dua kali launch-widget.vbs (tanpa terminal)
```

Klik kanan ikon tray untuk: tampil/sembunyi, selalu di atas, jalankan saat Windows menyala, reset posisi, keluar.
Tombol X di widget hanya menyembunyikan ke tray. Geser widget lewat header, posisinya diingat.

## Kalau status sesi tidak terbaca benar

Nama status internal Antigravity tidak terdokumentasi, jadi "perlu tindakan" dideteksi dari kata kunci
(`WAIT`, `BLOCK`, `APPROV`, `PERMISSION`, `CONFIRM`, ...). Cek nilai aslinya di komputermu:

```bash
npm run inspect
```

Hasilnya (struktur tabel dan nilai status, tanpa isi chat) bisa dipakai untuk menyesuaikan `ACTION_RE` di `electron/reader.mjs`.

## Struktur

* `electron/main.cjs`: window transparan tanpa frame, tray, single instance, autostart, wallpaper -> latar blur.
* `electron/reader.mjs`: proses Node terpisah yang membaca database (hanya query saat file berubah) dan mengirim JSON.
* `electron/preload.cjs`: jembatan IPC yang sempit dan aman.
* `src/`: UI React + CSS biasa (tanpa Tailwind).
