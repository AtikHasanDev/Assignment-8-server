# BookNook API — Assignment-8-server

Express API for the BookNook community library. Provides book management, authenticated borrowing and returns, and MongoDB-backed copy tracking.

**Live API:** https://booknook-api-atik.vercel.app  
**Live website:** https://booknook-atik.vercel.app  
**Frontend repository:** https://github.com/AtikHasanDev/Assignment-8

## Features

- Public catalogue with newest-first ordering and optional result limits.
- Protected book details and a user's own book collection.
- Owner-only book creation, editing, and deletion.
- Borrowing with a 14-day return date and per-user duplicate protection.
- Transactional borrowing, returns, updates, and deletion checks.
- JWT verification against the frontend's Better Auth JWKS endpoint.
- Zod input validation, CORS, Helmet, rate limiting, and JSON error responses.
- Repeatable starter catalogue seed and API integration tests.

## Technology

Node.js ES modules, Express 5, MongoDB, JOSE, Zod, Helmet, express-rate-limit, and CORS. Tests use Node's test runner, Supertest, and mongodb-memory-server.

## Local setup

Use Node.js 22 or newer and pnpm (pinned to 11.25.0; use a Node release supported by that package manager). MongoDB must be an Atlas cluster or a replica set because write workflows use transactions.

```sh
git clone https://github.com/AtikHasanDev/Assignment-8-server.git
cd Assignment-8-server
pnpm install
```

Copy `.env.example` to `.env` and set:

| Variable | Local example / purpose |
| --- | --- |
| `PORT` | `4000` |
| `MONGODB_URI` | MongoDB Atlas URI or `mongodb://localhost:27017/?replicaSet=rs0` |
| `MONGODB_DB` | `booknook`; must match the frontend authentication database setting |
| `CLIENT_ORIGIN` | `http://localhost:3000` |
| `AUTH_ISSUER` | `http://localhost:3000`; must match Better Auth's issuer |
| `AUTH_AUDIENCE` | `booknook-api` |
| `JWKS_URL` | `http://localhost:3000/api/auth/jwks` |

```sh
pnpm dev
```

The API listens at http://localhost:4000. Run the frontend too for sign-in and authenticated requests.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start with file watching and optional `.env` loading |
| `pnpm start` | Start without file watching |
| `pnpm seed` | Add eight starter books without replacing existing seed records |
| `pnpm test` | Run API integration tests |

The seed spans Fiction, Science, History, Kids, and Others. It uses upserts with insert-only values, so rerunning it does not reset availability or overwrite existing seeded books. Tests create an isolated in-memory MongoDB replica set and may download MongoDB binaries on the first run.

## API routes

Protected requests require `Authorization: Bearer <token>`.

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/books` | Public | List books, newest first |
| GET | `/books?limit=6` | Public | Limit results; allowed range is 0–100, with 0 meaning no limit |
| GET | `/books?mine=true` | Signed in | List books owned by the current user |
| GET | `/books/:id` | Signed in | Read a book's details |
| POST | `/books` | Signed in | Create a book |
| PATCH | `/books/:id` | Owner | Update a book using the complete book input |
| DELETE | `/books/:id` | Owner | Delete a book without active borrows |
| GET | `/borrows` | Signed in | List the current user's borrows |
| POST | `/borrows` | Signed in | Borrow an available book |
| DELETE | `/borrows/:id` | Borrow owner | Return a book |

Search and category filtering are handled by the frontend. The API always sorts catalogue results newest first.

### Book input

```json
{
  "title": "A Test Story",
  "author": "A Reader",
  "category": "Fiction",
  "image": "https://example.com/cover.jpg",
  "description": "A book for the community library.",
  "totalCopies": 3
}
```

Ownership, timestamps, and availability are assigned by the server. Borrowing accepts:

```json
{ "bookId": "<MongoDB book ObjectId>" }
```

Returns use the borrow record's ID, not the book ID. Errors use a JSON `message` field; common responses include 400 for invalid input, 401 for authentication failures, 403 for ownership violations, 404 for missing records, 409 for availability conflicts, and 429 for rate limits.

## Authentication and data integrity

Better Auth runs in the frontend project; this API does not issue sessions or handle Google callbacks. It verifies EdDSA JWTs with the configured issuer, audience, and remote public keys. Identity and ownership come from the verified token rather than request-body fields.

Borrowing decrements availability and inserts a borrow within one transaction. Returning removes the user's borrow and restores availability atomically. A unique user/book index prevents duplicate borrows. Owners cannot reduce total copies below the number borrowed or delete a book while copies are on loan.

## Project structure

```text
app.js                    Lazy Express entry point for Vercel
src/index.js              Local server entry point and shutdown handling
src/runtime.js            Database, authentication, and route composition
src/config.js             Environment configuration
src/db.js                 MongoDB connection and indexes
src/book-reads.js          Catalogue and detail routes
src/book-writes.js         Book creation, updates, and deletion
src/borrows.js             Borrow and return routes
src/auth.js               JWT verification and authentication middleware
src/validation.js         Request schemas
src/errors.js             Error handling
scripts/seed-catalogue.js  Repeatable starter data
test/api.test.js          API integration tests
```

## Deploying on Vercel

Import this repository as an Express project. The root `app.js` exports the application without opening a listening port and shares a database initialization promise across concurrent requests.

Configure production environment variables:

```text
MONGODB_URI=<your MongoDB connection string>
MONGODB_DB=<same database name as the frontend>
CLIENT_ORIGIN=https://booknook-atik.vercel.app
AUTH_ISSUER=https://booknook-atik.vercel.app
AUTH_AUDIENCE=booknook-api
JWKS_URL=https://booknook-atik.vercel.app/api/auth/jwks
```

Configure the frontend's `NEXT_PUBLIC_API_URL` as `https://booknook-api-atik.vercel.app`. Make sure MongoDB is reachable from Vercel and that the frontend's JWKS endpoint is accessible to the API. Redeploy after changing environment variables.

The root `/` has no health route and returns 404; use `/books` to check catalogue connectivity:

```sh
curl https://booknook-api-atik.vercel.app/books
```

Never commit `.env` or database credentials.
