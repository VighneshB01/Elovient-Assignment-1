# DECISIONS.md

Decisions made while building this project from scratch.

---

**Stack**
Went with the MERN stack — MongoDB, Express, React, Node.js. MongoDB fits well for activity logs since the schema is flexible and time-based queries with aggregation pipelines are straightforward. JWT was the natural choice for stateless auth in a single-page app.

**Authentication**
Passwords are hashed with bcrypt via a Mongoose pre-save hook so hashing is never accidentally skipped. JWTs carry `userId` and `role`. The `protect` middleware fetches the full user from the database on every protected request rather than trusting the token payload alone — this means a deleted user is immediately rejected.

**ActivityLog schema**
Used `timestamps: true` so Mongoose sets `createdAt` server-side automatically. `userId` is taken from the verified JWT, `ipAddress` from `req.socket.remoteAddress` / `x-forwarded-for`. Nothing timing or identity related comes from the client body.

**Custom rate limiting**
Implemented with a plain `countDocuments` query — count the user's logs in the last 10 seconds, reject with 429 if already at 5. No rate-limit library used for this rule. To prevent a race condition where two simultaneous requests both pass the check before either writes, requests per user are serialized with a lightweight Promise queue. Different users never block each other.

**Analytics**
All four stats (total actions, most common action, actions per minute, most active user) are computed with Mongoose aggregation pipelines. Returns safe zero/null values on an empty collection.

**Suspicious activity**
Two independent aggregation queries — high frequency (>20 actions/min) and multiple IPs (>2 distinct IPs/5 min) — run per request and their results are merged. A user appears once with the appropriate reason string.

**Replay protection**
Validated with two checks: clock skew must be ≤30 seconds, and the same user cannot repeat the same action within 3 seconds. State is an in-memory Map — no extra collection needed since persistence across restarts is not required.

**Frontend**
React with Redux Toolkit for auth and global state. The three activity pages (Simulator, Stats, Suspicious) use local `useState` — data is page-scoped and doesn't need to be shared. Stats page auto-refreshes every 5 seconds via `setInterval`, cleared on unmount.

**Environment and secrets**
`MONGO_URI` and `JWT_SECRET` are required env vars — server refuses to start if either is missing. `.env` is git-ignored. `.env.example` ships with clearly fake placeholder values.
