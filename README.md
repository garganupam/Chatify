# Chatify 💬

A full-stack real-time chat application built with the **MERN stack** and **Socket.IO**. Chatify supports instant one-on-one messaging, image sharing, user authentication with JWT, profile picture uploads via Cloudinary, real-time online presence indicators, and 32 switchable UI themes powered by DaisyUI.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Data Models](#data-models)
- [State Management](#state-management)
- [Real-Time Communication](#real-time-communication)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [Theming](#theming)

---

## Features

- **JWT Authentication** — Secure signup/login/logout with HttpOnly cookie-based token storage.
- **Real-Time Messaging** — Instant message delivery using Socket.IO; no page refresh needed.
- **Image Sharing** — Send images in chat; uploads are handled by Cloudinary and served via CDN URLs.
- **Profile Pictures** — Users can upload and update their profile photo, stored on Cloudinary.
- **Online Presence** — A live indicator shows which users are currently connected via Socket.IO.
- **32 UI Themes** — Light, dark, and specialty themes (cyberpunk, dracula, forest, etc.) selectable from the Settings page; preference persisted via Zustand.
- **Protected Routes** — Unauthenticated users are redirected to login; authenticated users cannot revisit auth pages.
- **Skeleton Loaders** — Smooth loading states for the user list and message thread while data fetches.

---

## Tech Stack

### Backend
| Package | Purpose |
|---|---|
| Express 5 | HTTP server and REST API |
| Mongoose 8 | MongoDB ODM — schema definitions and queries |
| Socket.IO 4 | WebSocket server for real-time events |
| bcryptjs | Password hashing |
| jsonwebtoken | JWT generation and verification |
| Cloudinary SDK | Image upload and CDN delivery |
| cookie-parser | Parse `jwt` cookie from incoming requests |
| cors | Cross-origin request handling for the Vite dev server |
| dotenv | Environment variable loading |
| nodemon | Auto-restart during development |

### Frontend
| Package | Purpose |
|---|---|
| React 19 | UI library |
| React Router DOM 7 | Client-side routing |
| Zustand 5 | Lightweight global state management |
| Axios | HTTP client with a shared base instance |
| Socket.IO Client | WebSocket client, connected on login |
| Tailwind CSS 4 | Utility-first styling |
| DaisyUI 5 | Component library and theme engine |
| lucide-react | Icon set |
| react-hot-toast | Toast notifications |
| Vite 6 | Build tool and dev server |

---

## Architecture Overview

```
Browser (React + Vite)
        │
        │  HTTP (Axios)          WebSocket (Socket.IO)
        ▼                               ▼
   Express REST API  ◄────────────  Socket.IO Server
        │                               │
        ▼                               ▼
    Mongoose ODM               userSocketMap (in-memory)
        │                         {userId → socketId}
        ▼
     MongoDB Atlas
        +
     Cloudinary (images)
```

The Express app and the Socket.IO server share the **same HTTP server instance** (`http.createServer(app)`), so both REST and WebSocket traffic come through the same port (5001 in development).

When a user logs in or the app starts, the frontend connects a Socket.IO socket passing `userId` as a handshake query param. The server stores this mapping in `userSocketMap`. When a message is sent, the backend looks up the receiver's socket ID and emits a `newMessage` event directly to them — no broadcasting to everyone.

---

## Project Structure

```
Chatify/
├── backend/
│   ├── src/
│   │   ├── index.js              # Express app setup, middleware registration, server start
│   │   ├── controllers/
│   │   │   ├── auth.controllers.js    # signup, login, logout, updateProfile, checkAuth
│   │   │   └── message.controller.js  # getUsersForSidebar, getMessages, sendMessage
│   │   ├── routes/
│   │   │   ├── auth.routes.js         # /api/auth/* routes
│   │   │   └── message.routes.js      # /api/messages/* routes
│   │   ├── middleware/
│   │   │   └── auth.middleware.js     # protectRoute — JWT verification guard
│   │   ├── models/
│   │   │   ├── user.model.js          # User schema (email, fullName, password, profilePic)
│   │   │   └── message.model.js       # Message schema (senderId, receiverId, text, image)
│   │   ├── lib/
│   │   │   ├── db.js                  # Mongoose connection helper
│   │   │   ├── socket.js              # Socket.IO server, userSocketMap, online user events
│   │   │   ├── cloudinary.js          # Cloudinary SDK configuration
│   │   │   └── utils.js               # generateToken — creates and sets JWT cookie
│   │   └── seeds/
│   │       └── user.seed.js           # Script to seed dummy users into MongoDB
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.jsx                # Root component — routing + auth guard
    │   ├── main.jsx               # React DOM render entry point
    │   ├── pages/
    │   │   ├── HomePage.jsx       # Chat layout: Sidebar + ChatContainer
    │   │   ├── LoginPage.jsx      # Login form
    │   │   ├── SignUpPage.jsx     # Registration form
    │   │   ├── ProfilePage.jsx    # Profile picture update
    │   │   └── SettingsPage.jsx   # Theme picker (32 DaisyUI themes)
    │   ├── components/
    │   │   ├── Navbar.jsx         # Top bar with nav links and logout
    │   │   ├── Sidebar.jsx        # User list with online indicators
    │   │   ├── ChatContainer.jsx  # Message thread view
    │   │   ├── ChatHeader.jsx     # Selected user info + online status
    │   │   ├── MessageInput.jsx   # Text + image message composer
    │   │   ├── NoChatSelected.jsx # Empty state shown before selecting a user
    │   │   ├── AuthImagePattern.jsx # Decorative grid shown on auth pages
    │   │   └── skeletons/         # Loading skeleton components
    │   ├── store/
    │   │   ├── useAuthStore.js    # Auth state + socket lifecycle management
    │   │   ├── useChatStore.js    # User list, messages, Socket.IO subscriptions
    │   │   └── useThemeStore.js   # Active theme (persisted to localStorage)
    │   ├── lib/
    │   │   └── axios.js           # Axios instance with baseURL + credentials
    │   └── constants/
    │       └── index.js           # THEMES array (32 DaisyUI theme names)
    ├── tailwind.config.mjs
    ├── vite.config.js
    └── package.json
```

---

## API Reference

### Auth Routes — `/api/auth`

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/signup` | No | Register a new user. Body: `{ fullName, email, password }`. Returns user object + sets `jwt` cookie. |
| `POST` | `/login` | No | Authenticate user. Body: `{ email, password }`. Returns user object + sets `jwt` cookie. |
| `POST` | `/logout` | No | Clears the `jwt` cookie. |
| `PUT` | `/update-profile` | Yes | Update profile picture. Body: `{ profilePic }` (base64 string). Uploads to Cloudinary, returns updated user. |
| `GET` | `/check` | Yes | Returns the current authenticated user. Used to rehydrate auth state on page refresh. |

### Message Routes — `/api/messages`

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/users` | Yes | Returns all users except the logged-in user (for sidebar list). |
| `GET` | `/:id` | Yes | Fetches full message history between the logged-in user and user `id`, sorted by `createdAt` ascending. |
| `POST` | `/send/:id` | Yes | Sends a message to user `id`. Body: `{ text?, image? }`. If `image` is provided (base64), it is uploaded to Cloudinary. Emits `newMessage` Socket.IO event to receiver if online. |

All protected routes use the `protectRoute` middleware, which reads the `jwt` HttpOnly cookie, verifies it, and attaches the full `req.user` object before the controller runs.

---

## Data Models

### User

```js
{
  email:      String,   // required, unique
  fullName:   String,   // required
  password:   String,   // required, min 6 chars (stored as bcrypt hash)
  profilePic: String,   // Cloudinary URL, defaults to ""
  createdAt:  Date,     // auto (timestamps: true)
  updatedAt:  Date      // auto
}
```

### Message

```js
{
  senderId:   ObjectId → User,  // required
  receiverId: ObjectId → User,  // required
  text:       String,           // optional (message may be image-only)
  image:      String,           // optional Cloudinary URL
  createdAt:  Date,             // auto (timestamps: true)
  updatedAt:  Date
}
```

Conversation retrieval queries both directions — `(sender: me, receiver: them) OR (sender: them, receiver: me)` — to produce a unified, time-sorted thread.

---

## State Management

Chatify uses **Zustand** for global client state, split into three stores:

### `useAuthStore`

Manages the logged-in user, loading flags, the Socket.IO socket instance, and the list of currently online users.

- `authUser` — the current user object (or `null`).
- `onlineUsers` — array of `userId` strings, updated in real time via the `getOnlineUsers` socket event.
- `socket` — the active Socket.IO connection.
- `checkAuth()` — called on app mount; hits `/api/auth/check` to restore session.
- `signup()`, `login()`, `logout()` — handle auth flows and connect/disconnect the socket accordingly.
- `updateProfile()` — sends base64 image to the backend for Cloudinary upload.
- `connectSocket()` / `disconnectSocket()` — socket lifecycle, called internally by auth actions.

### `useChatStore`

Manages the user list (sidebar), the active message thread, and real-time message subscriptions.

- `users` — all other registered users.
- `messages` — messages in the currently open conversation.
- `selectedUser` — the user whose conversation is open.
- `getUsers()` — fetches sidebar user list.
- `getMessages(userId)` — fetches full thread with the given user.
- `sendMessage(messageData)` — posts message to the API; optimistically appends to local state.
- `subscribeToMessages()` — listens on the `newMessage` socket event and appends incoming messages.
- `unsubscribeFromMessages()` — removes the listener (called when switching conversations).

### `useThemeStore`

Holds the active DaisyUI `theme` string. Persisted to `localStorage` so the choice survives page reloads.

---

## Real-Time Communication

The Socket.IO integration follows a simple room-free, direct-emit model:

**Connection flow:**
1. User logs in → `connectSocket()` opens a socket to the backend with `userId` in the query string.
2. Server stores `userSocketMap[userId] = socket.id`.
3. Server broadcasts `getOnlineUsers` event with all current keys of `userSocketMap` to every client.
4. Each client updates its `onlineUsers` array in `useAuthStore`.

**Message delivery flow:**
1. Sender calls `sendMessage()` → REST `POST /api/messages/send/:id`.
2. Backend saves the `Message` document to MongoDB.
3. Backend looks up `receiverSocketId = userSocketMap[receiverId]`.
4. If the receiver is online, backend emits `newMessage` directly to their socket ID.
5. Receiver's `useChatStore` listener appends the message to the thread if that conversation is currently open.

**Disconnection:**
1. Socket `disconnect` event fires.
2. Server deletes `userSocketMap[userId]` and re-broadcasts `getOnlineUsers`.

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster (or local MongoDB)
- A [Cloudinary](https://cloudinary.com/) account (free tier works)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/garganupam/Chatify.git
cd Chatify

# 2. Install backend dependencies
cd backend
npm install

# 3. Install frontend dependencies
cd ../frontend
npm install
```

---

## Environment Variables

Create a `.env` file inside the `backend/` directory with the following keys:

```env
# Server
PORT=5001
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/chat_db?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your_strong_jwt_secret_here

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> **Note:** The `.env` file committed to the repository contains real credentials — rotate those keys immediately if this is a production deployment.

---

## Running the App

### Development (two terminals)

```bash
# Terminal 1 — Backend (port 5001)
cd backend
npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

The Vite dev server is configured to proxy API and WebSocket traffic to the backend, and CORS on the backend is set to allow `http://localhost:5173`.

### Seed Dummy Users (optional)

```bash
cd backend
node src/seeds/user.seed.js
```

This populates your MongoDB with a set of pre-built test users so you can start chatting immediately.

---

## Theming

Chatify supports **32 DaisyUI themes** selectable at runtime from the Settings page. The full list:

`light` · `dark` · `cupcake` · `bumblebee` · `emerald` · `corporate` · `synthwave` · `retro` · `cyberpunk` · `valentine` · `halloween` · `garden` · `forest` · `aqua` · `lofi` · `pastel` · `fantasy` · `wireframe` · `black` · `luxury` · `dracula` · `cmyk` · `autumn` · `business` · `acid` · `lemonade` · `night` · `coffee` · `winter` · `dim` · `nord` · `sunset`

The selected theme is stored in Zustand's `useThemeStore` (persisted to `localStorage`) and applied via the `data-theme` attribute on the root `<div>` in `App.jsx`, which DaisyUI picks up automatically.

---

## Author

**Anupam Garg** — [@garganupam](https://github.com/garganupam)
