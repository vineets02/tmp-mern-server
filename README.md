# TVF MERN – Server (Express + MongoDB)

## Setup
1. Create `.env` from `.env.example` and set `MONGO_URI` if needed.
2. Install & run:
   ```bash
   npm install
   npm run dev
   ```
3. Seed sample data (optional):
   ```bash
   npm run seed
   ```

## Endpoints
- `GET /api/health` – health check
- `GET /api/shows` – list shows (search with `?q=`)
- `GET /api/shows/:slug` – show by slug
