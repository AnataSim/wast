# 🎬 WAST — Anime & Manga WatchList Tracker

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Firebase-11.2-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Security-AES--256--GCM%20%7C%20HMAC--SHA256-4ade80?style=for-the-badge&logo=shield&logoColor=black" alt="Security" />
</p>

A state-of-the-art, premium anime and manga tracking application featuring glassmorphism design, real-time Firebase synchronization, interactive profile croppers, AES-256-GCM payload encryption, HMAC-SHA256 request authentication, and PNG poster export capabilities.

---

## ✨ Features

### 🔒 Enterprise-Grade Security
- **AES-256-GCM Payload Encryption**: All sensitive data payloads are encrypted using 256-bit AES in Galois/Counter Mode (GCM) with 96-bit Initialization Vectors (IV) and 128-bit authentication tags via Web Crypto API.
- **HMAC-SHA256 Request Authentication**: Every request payload includes cryptographic HMAC-SHA256 signatures (`X-HMAC-Signature`), timestamps (`X-Timestamp`), and nonces (`X-Nonce`) to ensure request integrity and prevent replay attacks.

### 🔐 Authentication & Unique Usernames
- **Firebase Auth**: Secure Email & Password authentication with persistent session state.
- **Unique Username Registry**: Case-insensitive unique username enforcement backed by Firestore.
- **Live Username Validation**: Real-time availability indicator during registration.

### 👤 Profile Customization & Interactive Cropper
- **Interactive Avatar & Banner Editor**: Pick any PNG, JPG, WebP, or animated GIF image.
- **Drag & Zoom Cropper**: Drag image to reposition, scroll/slider to zoom with constrained bounds.
- **16:9 Banner Support**: Preserves 16:9 aspect ratio for profile banners.
- **Animated GIF Support**: Keeps native animation frame rate for GIF avatars and banners.

### 📊 Real-Time Analytics & Dashboard
- **Live Stats Summary**: Tracks total watching, reading, completed, plan to watch, on-hold, and dropped titles.
- **Time & Chapter Calculator**: Calculates total hours watched and remaining watch/read time.
- **Average Ratings**: Auto-calculates overall score across all rated media.

### 📑 Smart Watchlist & Pagination
- **Advanced Filtering & Sorting**: Filter by category (Anime/Manga), status, genre, favorites, and search query. Sort by title, rating, release year, or progress.
- **Custom Order Reordering**: Drag or move items up/down to customize your personal list order.
- **Smart Pagination**: Automatically activates when list reaches 11+ titles (10 / 20 / All per page).
- **Episode & Chapter Progress**: Quick `+1` / `-1` progress buttons and timestamp bookmarking.

### 🖼️ High-Res PNG Poster Export
- **One-Click PNG Export**: Render your active watchlist and stats into a high-quality showcase PNG image.
- **Pagination-Aware Export**: Exports precisely the active page or full list as selected.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Security**: Web Crypto API (AES-256-GCM, HMAC-SHA256)
- **Styling**: Vanilla CSS3, Glassmorphism, CSS Custom Properties, Responsive Flexbox/Grid
- **Icons**: Lucide React
- **Backend / DB**: Firebase Authentication, Cloud Firestore, Firebase Storage
- **Exporting**: `html-to-image` for high-resolution PNG generation

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` or `yarn` or `pnpm`

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AnataSim/wast.git
   cd wast
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_SECURITY_SECRET=your_custom_aes_hmac_secret
   ```

4. **Run Development Server:**
   ```bash
   npm run dev
   ```

5. **Build for Production:**
   ```bash
   npm run build
   ```

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
