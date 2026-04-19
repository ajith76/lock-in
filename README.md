# 🔒 Lock In — Full-Stack Habit Tracker

A minimal, professional, and dark-themed habit tracking dashboard designed to help you stay consistent. Built with a modern Angular frontend and a robust Express/Prisma backend.

![Habit Tracker Preview](https://via.placeholder.com/1200x600.png?text=Lock+In+Habit+Tracker+Dashboard)

## 🚀 Key Features

- **Daily Tracking**: Intuitive 31-day calendar grid for visual consistency.
- **Dynamic Stats**: Real-time completion rates, daily averages, and best streaks.
- **Analytics**: Visual progress charts using Chart.js.
- **Secure Auth**: JWT-based authentication with HTTP-only cookies.
- **Persistent Data**: SQLite database managed via Prisma ORM.
- **Dark Mode**: Minimalist, high-contrast UI for focused tracking.

## 🛠️ Technology Stack

- **Frontend**: Angular 21 (Signals, Standalone Components, SCSS)
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT (Access & Refresh Tokens)
- **Styling**: Vanilla CSS/SCSS (Custom Design System)

---

## 🏁 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/ajith76/lock-in.git
cd lock-in
```

### 2. Setup the Backend
The backend handles authentication and data persistence.

```bash
cd server
npm install
```

**Configure Environment**:
Create a `.env` file in the `server` folder:
```env
DATABASE_URL="file:./dev.db"
JWT_ACCESS_SECRET="your_access_secret_here"
JWT_REFRESH_SECRET="your_refresh_secret_here"
PORT=3000
```

**Initialize Database**:
```bash
npx prisma migrate dev --name init
```

**Start Backend**:
```bash
npm run dev
```
The API will be running at `http://localhost:3000`.

### 3. Setup the Frontend
Open a new terminal window in the root directory.

```bash
npm install
ng serve
```
The app will be running at `http://localhost:4200` (or the port specified by Angular CLI).

---

## 🔒 Authentication Note
When you first run the app, you will be redirected to the **Login** page. 
- Go to `/register` to create your first account.
- Once registered, you can start adding habits and tracking your progress.

## 📁 Repository Structure
- `/src`: Angular frontend source code.
- `/server`: Express backend, Prisma schema, and API routes.
- `/server/prisma`: SQLite database file and migration logs.

---

## 📄 License
MIT License. Feel free to use and modify for your own personal growth!
