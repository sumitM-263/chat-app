# QuickChat — Real-Time MERN Chat Application

QuickChat is a full-stack real-time messaging application built with **React, Node.js, Express, MongoDB, and Socket.IO**.

It supports user authentication, profile management, one-to-one text and image messaging, online/offline presence, unread-message counts, image uploads through Cloudinary, and a responsive chat interface.

## Features

- User signup and login
- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- Persistent login using localStorage
- User profile editing
- Profile image upload
- Bio editing
- Search users by name
- One-to-one real-time messaging
- Text messages
- Image messages
- Cloudinary image storage
- Online/offline user status
- Real-time online-user updates
- Unread message counters
- Conversation history stored in MongoDB
- Responsive three-panel chat layout
- Toast notifications
- Protected frontend routes
- Vite development setup
- Tailwind CSS styling

---

## Tech Stack

### Frontend

- React 19
- Vite
- React Router
- Axios
- Socket.IO Client
- React Hot Toast
- Tailwind CSS
- JavaScript / JSX

### Backend

- Node.js
- Express
- Socket.IO
- MongoDB
- Mongoose
- JWT (`jsonwebtoken`)
- bcryptjs
- Cloudinary
- CORS
- dotenv

---

## Architecture

```text
                         ┌──────────────────────┐
                         │      React Client    │
                         │   Vite + Tailwind    │
                         └──────────┬───────────┘
                                    │
                       HTTP / REST  │  Socket.IO
                                    │
                  ┌─────────────────┴─────────────────┐
                  │                                   │
                  ▼                                   ▼
        ┌──────────────────┐                ┌──────────────────┐
        │ Express REST API │                │    Socket.IO     │
        │   /api/auth      │                │ Real-time events │
        │   /api/messages  │                │ Online presence │
        └────────┬─────────┘                └────────┬─────────┘
                 │                                   │
                 └────────────────┬──────────────────┘
                                  ▼
                       ┌─────────────────────┐
                       │ Node.js Application │
                       └──────────┬──────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
          ┌──────────────────┐        ┌──────────────────┐
          │ MongoDB          │        │    Cloudinary    │
          │ Users & Messages │        │ Profile & Images │
          └──────────────────┘        └──────────────────┘
```

---

## Project Structure

```text
chat-app-main/
│
├── client/
│   ├── public/
│   │
│   ├── src/
│   │   ├── assets/
│   │   │   └── Images, icons, logos, backgrounds
│   │   │
│   │   ├── components/
│   │   │   ├── ChatContainer.jsx
│   │   │   ├── RightSidebar.jsx
│   │   │   └── Sidebar.jsx
│   │   │
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ChatContext.jsx
│   │   │
│   │   ├── lib/
│   │   │   └── utils.js
│   │   │
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   └── ProfilePage.jsx
│   │   │
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── server/
    ├── controllers/
    │   ├── messageController.js
    │   └── userController.js
    │
    ├── lib/
    │   ├── cloudinary.js
    │   ├── db.js
    │   └── utils.js
    │
    ├── middlewares/
    │   └── auth.js
    │
    ├── models/
    │   ├── Message.js
    │   └── User.js
    │
    ├── routes/
    │   ├── messageRoutes.js
    │   └── userRoutes.js
    │
    ├── server.js
    └── package.json
```

---

# How the Application Works

## 1. Authentication

Users can either create an account or log in.

### Signup flow

The client sends:

```text
fullName
email
password
bio
```

to:

```text
POST /api/auth/signup
```

The server:

1. Validates required fields.
2. Checks whether the email already exists.
3. Generates a bcrypt salt.
4. Hashes the password.
5. Creates the user in MongoDB.
6. Generates a JWT containing the user's ID.
7. Returns the user data and token.

The password is never intentionally stored as plain text.

---

## 2. Login

The client sends:

```text
email
password
```

to:

```text
POST /api/auth/login
```

The server:

1. Finds the user by email.
2. Uses `bcrypt.compare()` to compare the supplied password with the stored hash.
3. Generates a JWT if the password is valid.
4. Returns the authenticated user's data and token.

The client stores the token in:

```text
localStorage
```

and also configures Axios to send it with subsequent API requests.

---

## 3. JWT Route Protection

Protected requests use the `protectRoute` middleware.

The middleware:

```text
Request
   ↓
Read token from request headers
   ↓
jwt.verify()
   ↓
Extract userId
   ↓
Find user in MongoDB
   ↓
Attach user to req.user
   ↓
Continue to controller
```

Protected endpoints include:

```text
GET  /api/auth/check
PUT  /api/auth/update-profile

GET  /api/messages/users
GET  /api/messages/:id
PUT  /api/messages/mark/:id
POST /api/messages/send/:id
```

---

# Real-Time Messaging

Socket.IO is used for real-time communication.

When an authenticated client connects, the user ID is sent as a Socket.IO query parameter:

```text
userId
```

The server maintains an in-memory mapping:

```javascript
userSocketMap = {
    userId: socketId
}
```

This allows the server to identify the socket belonging to a particular user.

### When a user connects

The server:

1. Receives the user's ID.
2. Stores the user's socket ID.
3. Broadcasts the list of online users.

### When a user disconnects

The server:

1. Removes the user's socket ID.
2. Broadcasts the updated online-user list.

---

# Sending Messages

A message is sent through:

```text
POST /api/messages/send/:id
```

The request can contain:

```json
{
  "text": "Hello!"
}
```

or an image represented as a data URL.

The server:

1. Identifies the sender from the JWT.
2. Gets the receiver ID from the route.
3. Uploads an image to Cloudinary if one is included.
4. Creates a `Message` document in MongoDB.
5. Checks whether the receiver is online.
6. Emits a `newMessage` Socket.IO event to the receiver if connected.
7. Returns the newly created message.

This gives the application both:

- Persistent message storage
- Real-time message delivery

---

# Message Seen / Unread System

Each message contains:

```text
seen: Boolean
```

New messages default to:

```text
seen = false
```

When messages are retrieved for a conversation, messages sent to the current user are marked as seen.

The sidebar also calculates the number of unseen messages for each user.

Example:

```text
Alice        3
Bob          1
Charlie
```

When a new message arrives through Socket.IO and the conversation is not currently open, the unread count is incremented.

When the user selects that conversation, the unread count is reset.

---

# Image Messaging

The chat supports image messages.

The frontend:

1. Selects an image file.
2. Verifies that it is an image.
3. Converts it to a Base64 data URL using `FileReader`.
4. Sends the data to the backend.

The backend uploads the image to **Cloudinary** and stores the returned secure URL in MongoDB.

The message therefore contains either:

```text
text
```

or:

```text
image URL
```

The right sidebar also extracts images from the current conversation and displays them in a media gallery.

---

# User Profiles

Each user has:

```text
fullName
email
password
profilePic
bio
```

The profile page allows the authenticated user to update:

- Name
- Bio
- Profile picture

If a new profile image is supplied, it is uploaded to Cloudinary.

The server then updates the MongoDB user document with the Cloudinary URL.

---

# Frontend Pages

## Login / Signup

Route:

```text
/login
```

Provides:

- Login
- Signup
- Email input
- Password input
- Full name during signup
- Bio during signup
- Terms/privacy checkbox UI
- Form validation

Signup uses a two-step interface where the user first provides account credentials and then provides their bio.

---

## Home

Route:

```text
/
```

The home page contains three main areas:

```text
┌─────────────┬─────────────────────┬──────────────┐
│   Sidebar   │    Chat Container   │ RightSidebar │
│             │                     │              │
│ Search      │ Selected user       │ User profile │
│ Users       │ Messages            │ Bio          │
│ Online      │ Message input       │ Media        │
│ Unread      │ Image upload        │ Logout       │
└─────────────┴─────────────────────┴──────────────┘
```

The layout changes responsively for smaller screens.

---

## Profile

Route:

```text
/profile
```

Allows users to:

- Upload a profile image
- Change their name
- Change their bio
- Save their changes

---

# React Context Architecture

The application uses two React Context providers.

## AuthContext

`AuthContext.jsx` manages:

- Authentication state
- JWT token
- Current user
- Online users
- Socket connection
- Login
- Logout
- Profile updates
- Authentication checks
- Axios configuration

Important state includes:

```javascript
authUser
onlineUsers
socket
token
```

---

## ChatContext

`ChatContext.jsx` manages:

- Users
- Selected user
- Messages
- Unread-message counts
- Fetching users
- Fetching messages
- Sending messages
- Socket message subscriptions

Important state includes:

```javascript
users
selectedUser
messages
unseenMessages
```

---

# API Reference

## Authentication

### Signup

```http
POST /api/auth/signup
```

Request:

```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "bio": "Hello, I am John."
}
```

---

### Login

```http
POST /api/auth/login
```

Request:

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

---

### Check Authentication

```http
GET /api/auth/check
```

Requires the JWT token.

---

### Update Profile

```http
PUT /api/auth/update-profile
```

Requires authentication.

Example:

```json
{
  "fullName": "John Doe",
  "bio": "Updated bio"
}
```

A profile image can also be supplied as a data URL.

---

## Messages

### Get Users

```http
GET /api/messages/users
```

Returns:

- Other registered users
- Unseen-message counts

---

### Get Conversation

```http
GET /api/messages/:id
```

Returns messages exchanged between the authenticated user and the selected user.

---

### Send Message

```http
POST /api/messages/send/:id
```

Example text message:

```json
{
  "text": "Hello!"
}
```

Example image message:

```json
{
  "image": "data:image/jpeg;base64,..."
}
```

---

### Mark Message as Seen

```http
PUT /api/messages/mark/:id
```

Marks a message as read.

---

# Database Models

## User

The `User` model contains:

```javascript
{
    email,
    fullName,
    password,
    profilePic,
    bio,
    createdAt,
    updatedAt
}
```

The email is unique.

---

## Message

The `Message` model contains:

```javascript
{
    senderId,
    receiverId,
    text,
    image,
    seen,
    createdAt,
    updatedAt
}
```

`senderId` and `receiverId` reference MongoDB `User` documents.

---

# Environment Variables

Create a `.env` file inside the `server` directory.

Example:

```env
PORT=5000

MONGODB_URI=mongodb://localhost:27017

JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

The client also expects:

```env
VITE_BACKEND_URL=http://localhost:5000
```

Create this in:

```text
client/.env
```

### Do not commit secrets

Never commit:

```text
.env
```

or real:

```text
JWT_SECRET
MONGODB_URI
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

to GitHub.

---

# Installation

## Prerequisites

Install:

- Node.js
- npm
- MongoDB or access to MongoDB Atlas
- Cloudinary account

---

## 1. Clone the repository

```bash
git clone <your-repository-url>
cd chat-app-main
```

---

## 2. Install backend dependencies

```bash
cd server
npm install
```

---

## 3. Configure backend environment variables

Create:

```text
server/.env
```

and add the required MongoDB, JWT, Cloudinary, and optional port configuration.

---

## 4. Install frontend dependencies

Open another terminal:

```bash
cd client
npm install
```

Create:

```text
client/.env
```

with:

```env
VITE_BACKEND_URL=http://localhost:5000
```

---

# Running the Application

## Start backend

From `server/`:

```bash
npm start
```

For development with automatic restart:

```bash
npm run server
```

The backend defaults to:

```text
http://localhost:5000
```

---

## Start frontend

From `client/`:

```bash
npm run dev
```

Vite will provide a local development URL, normally:

```text
http://localhost:5173
```

Open that URL in your browser.

---

# Development Workflow

```text
User
 │
 ▼
React UI
 │
 ├──────────────► REST API ──────────────► Express
 │                                           │
 │                                           ├── JWT/Auth
 │                                           ├── Controllers
 │                                           └── MongoDB
 │
 └──────────────► Socket.IO ──────────────► Node/Socket.IO
                                             │
                                             └── Real-time events
```

For images:

```text
React
  │
  ▼
Base64 image
  │
  ▼
Express API
  │
  ▼
Cloudinary
  │
  ▼
Secure image URL
  │
  ▼
MongoDB Message/User document
```

---

# Security

The project includes several security-related mechanisms:

### Password hashing

Passwords are hashed using `bcryptjs`.

### JWT authentication

JWTs are used to authenticate protected API requests.

### Protected routes

Authenticated operations use the `protectRoute` middleware.

### Password exclusion

When retrieving users for the sidebar, the password field is excluded:

```javascript
.select("-password")
```

### Environment secrets

Database, JWT, and Cloudinary credentials are read from environment variables.


