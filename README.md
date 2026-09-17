# Elovient Assignment

This is a task management dashboard I built to practice working with React, Redux, Express, and MongoDB.

## What it includes

- User signup and login
- Task creation and status updates
- Dashboard statistics
- Activity simulation and suspicious activity views
- Light and dark themes
- User and profile pages

## Run it locally

You need Node.js and a MongoDB connection.

### 1. Start the server

```bash
cd server
npm install
```

Create a `.env` file in the `server` folder using `.env.example` and add your MongoDB connection and JWT secret. Then run:

```bash
npm start
```

The API runs on `http://localhost:5000` by default.

### 2. Start the client

Open another terminal and run:

```bash
cd client
npm install
npm run dev
```

The frontend will be available at the local URL shown by Vite.

## Build the client

```bash
cd client
npm run build
```