# HNG-SHOP 🚀
A Modern E-Commerce Platform with a **Web App** and an **Android App**, sharing one Supabase backend.

## ✨ Features
- Next.js + Tailwind CSS web app
- Android mobile app built with React Native (Expo)
- Same login on web and mobile (Supabase Auth)
- Product Listing and Cart
- Cart syncs both ways: Web → Mobile and Mobile → Web

## 🚀 Live Demo
- 🌐 Web: https://hng-shop01-5no602juw-harshita-5b52.vercel.app/
- 📱 APK Download: https://drive.google.com/file/d/1OsKtYLJhez0mogzkdJS8pweAoQ8-tgXJ/view?usp=drivesdk
- 🎥 Demo Video: 

## 🔗 Repositories
| Part | Repo |
|------|------|
| 🌐 Web App | https://github.com/Harshita24-hack/hng-shop01 |
| 📱 Mobile App (this repo) | https://github.com/Harshita24-hack/hng-shop01-mobile |

---

# 🌐 Web App

## 🛠️ Tech Stack
- Next.js
- React
- Tailwind CSS
- TypeScript
- Supabase

## 📦 Installation

```bash
git clone https://github.com/Harshita24-hack/hng-shop01.git
cd hng-shop01
npm install
npm run dev
```

Create a `.env.local` file first:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

# 📱 Mobile App

## 🛠️ Tech Stack
- React Native
- Expo
- Supabase
- EAS Build

## 📦 Installation

```bash
git clone https://github.com/Harshita24-hack/hng-shop01-mobile.git
cd hng-shop01-mobile/shop-mobile
npm install
npx expo start --tunnel
```

Open `lib/supabase.js` and add your Supabase URL and anon key, then scan the QR code with **Expo Go**.

---

# 📦 Android APK

## ⬇️ Download and Install
1. Download the APK: `<YOUR_GOOGLE_DRIVE_APK_LINK>`
2. Open the file on your Android phone (allow "Install unknown apps" if asked)
3. Tap **Install**, then open **HNG Shop**
4. Sign in with the same account you use on the website

## 🔨 Build the APK yourself

```bash
cd shop-mobile
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

---

## 🔄 How the Sync Works
```
Web (Next.js)  ──┐
                 ├── Supabase (Auth + products + cart_items)
Mobile (Expo)  ──┘
```
Both apps use the same Supabase project and the same user accounts. Every cart change is saved in the `cart_items` table, so it shows up on the other platform. Row Level Security keeps each user's cart private.

## 👩‍💻 Author
Harshita24-hack

## 📄 License
MIT
