// import express from 'express'
// import morgan from 'morgan'
// import cors from 'cors'
// import dotenv from 'dotenv'
// import mongoose from 'mongoose'
// import showsRouter from './routes/shows.routes.js'
// import authRouter from './routes/auth.routes.js'
// import path from 'path';
// import { fileURLToPath } from 'url';
// import contactRoutes from './routes/contact.routes.js'

// dotenv.config()
// const app = express()

// app.use(express.json())
// app.use(morgan('dev'))
// app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*'}))

// const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tvfdb'
// const PORT = process.env.PORT || 5000

// mongoose.connect(MONGO_URI).then(() => {
//   console.log('Mongo connected')
// }).catch(err => {
//   console.error('Mongo error', err)
//   process.exit(1)
// })
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// app.get('/api/health', (req,res)=>res.json({ ok:true, ts: Date.now() }))
// app.use('/api/shows', showsRouter)
// app.use('/api/auth', authRouter);
// app.use("/api/contact", contactRoutes);
// app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// app.use((req,res)=>res.status(404).json({ error:'Not found'}))

// app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`))


import express from 'express'
import morgan from 'morgan'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import showsRouter from './routes/shows.routes.js'
import authRouter from './routes/auth.routes.js'
import path from 'path'
import { fileURLToPath } from 'url'
import contactRoutes from './routes/contact.routes.js'

dotenv.config()
const app = express()

// Render (and most PaaS) put you behind a proxy. This makes req.ip correct.
app.set('trust proxy', 1)

// Basic hardening + sensible limits
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// CORS — allow your local and deployed frontends
const allowlist = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean)
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true) // allow curl/postman
      if (allowlist.length === 0 || allowlist.includes(origin)) return cb(null, true)
      cb(new Error('Not allowed by CORS'))
    },
    credentials: false,
  })
)

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tvfdb'
const PORT = process.env.PORT || 5000

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('Mongo connected'))
  .catch(err => {
    console.error('Mongo error', err)
    process.exit(1)
  })

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Health + readiness (Render pings this)
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }))

// APIs
app.use('/api/shows', showsRouter)
app.use('/api/auth', authRouter)
app.use('/api/contact', contactRoutes)

// Static (uploads). NOTE: Render disk is ephemeral unless you attach a “Disk”.
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }))

const server = app.listen(PORT, () => {
  console.log(`API on http://0.0.0.0:${PORT}`)
})

// Graceful shutdown (Render sends SIGTERM on deploys)
const shutdown = () => {
  console.log('Shutting down…')
  server.close(() => {
    mongoose.connection.close(false).then(() => process.exit(0))
  })
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
