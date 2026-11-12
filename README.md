# StudioSpace API

Express and MongoDB API for StudioSpace listings and reservations. The [Next.js client](https://github.com/AtikHasanDev/Assignment-8) handles sign-in, image uploads, and browser requests.

## Local setup

1. Use Node.js 22 or newer with the pinned pnpm version. Run `pnpm install --frozen-lockfile`.
2. Copy `.env.example` to `.env` and configure the values below.
3. Run `pnpm seed:studios` to insert six demo studios. Re-running the seed preserves existing records.
4. Run `pnpm dev` to start the API on port 4000, and start the Next.js client on port 3000.

| Variable | Local value or purpose |
| --- | --- |
| `PORT` | `4000` |
| `MONGODB_URI` | Atlas connection string or a local MongoDB replica-set URI |
| `MONGODB_DB` | Match the client’s database name |
| `CLIENT_ORIGIN` | `http://localhost:3000` |
| `AUTH_ISSUER` | `http://localhost:3000` |
| `AUTH_AUDIENCE` | `booknook-api` (the existing Better Auth JWT audience) |
| `JWKS_URL` | `http://localhost:3000/api/auth/jwks` |

## StudioSpace endpoints

| Method | Path | Access | Behavior |
| --- | --- | --- | --- |
| GET | `/api/studios` | Public | List newest studios, with optional `category` and `limit` filters |
| GET | `/api/studios/:id` | Public | Read a studio’s details |
| GET | `/api/studios/mine` | Signed in | List the host’s studios |
| POST | `/api/studios` | Signed in | Create a studio with the signed-in host’s identity |
| PATCH | `/api/studios/:id` | Host | Update supplied listing fields |
| DELETE | `/api/studios/:id` | Host | Delete a listing |
| GET | `/api/bookings` | Signed in | List the current user’s reservations |
| POST | `/api/bookings` | Signed in | Request a future slot and reject overlaps with Confirmed bookings |
| PATCH | `/api/bookings/:id/cancel` | Reservation owner | Change a Pending booking to Cancelled |

Booking creation accepts a `studioId` and ISO timestamps `startsAt` and `endsAt` with a timezone offset or UTC designator. New reservations start as Pending. Existing Confirmed bookings block overlapping requests for the same studio. Back-to-back slots are allowed.

For protected calls, use the client’s same-origin `/api/studiospace` bridge. It obtains a short-lived JWT from Better Auth and forwards it in the `studiospace_token` cookie. Express verifies the signature, issuer, and audience. Ownership checks use the verified identity.

## Verification and deployment

- Run `pnpm test` for the existing API integration suite. Its in-memory replica set may need to download MongoDB binaries on the first run.
- Request `GET /api/studios?limit=6` to check the sample catalog, then use the client to test protected listing and booking flows.
- Deploy the root `app.js` as the Express entry point on Vercel. Set `CLIENT_ORIGIN` and `AUTH_ISSUER` to the deployed client origin and point `JWKS_URL` to that origin’s Better Auth key endpoint.
- Keep database credentials and provider secrets in environment variables.
