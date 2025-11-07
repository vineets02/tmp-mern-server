import { Router } from 'express'
import Show from '../models/Show.js'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

const r = Router()

// Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads'
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname)
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9]+/gi, '-').toLowerCase()
    cb(null, `${Date.now()}-${base}${ext}`)
  }
})
const upload = multer({ storage })

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Missing token' })
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev')
    if (decoded?.role !== 'admin') throw new Error('not admin')
    req.user = decoded
    next()
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// Public list
r.get('/', async (req,res) => {
  const q = (req.query.q || '').toLowerCase()
  let shows = await Show.find().sort({ createdAt: -1 }).lean()
  if (q) {
    shows = shows.filter(s => (s.title?.toLowerCase().includes(q) || s.genre?.toLowerCase().includes(q)))
  }
  res.json(shows)
})

// Public single
r.get('/:slug', async (req,res) => {
  const show = await Show.findOne({ slug: req.params.slug }).lean()
  if (!show) return res.status(404).json({ error: 'Show not found' })
  res.json(show)
})

r.get('/__hero/current', async (_req, res) => {
  let hero = await Show.findOne({ isHero: true }).sort({ updatedAt: -1 }).lean()
  if (!hero) hero = await Show.findOne().sort({ createdAt: -1 }).lean()
  res.json(hero || null)
})

// Admin create
// r.post('/', requireAdmin, upload.fields([
//   { name: 'thumbnail', maxCount: 1 },
//   { name: 'poster', maxCount: 1 }
// ]), async (req,res) => {
//   const body = req.body || {}
//   const files = req.files || {}
//   const payload = {
//     slug: body.slug,
//     title: body.title,
//     description: body.description,
//     genre: body.genre,
//     tag: body.tag || 'original',
//     youtubeUrl: body.youtubeUrl,
//     awards: (body.awards || '').split(',').map(s => s.trim()).filter(Boolean),
//     cast: (body.cast || '').split(',').map(s => s.trim()).filter(Boolean),
//     thumbnail: files.thumbnail?.[0] ? `/uploads/${files.thumbnail[0].filename}` : body.thumbnail,
//     poster: files.poster?.[0] ? `/uploads/${files.poster[0].filename}` : body.poster,
//   }
//   try {
//     const created = await Show.create(payload)
//     res.status(201).json(created)
//   } catch (e) {
//     res.status(400).json({ error: e.message })
//   }
// })

// r.post('/', requireAdmin, upload.fields([
//   { name: 'thumbnail', maxCount: 1 },
//   { name: 'poster', maxCount: 1 },
//   // optional hero video
//   { name: 'heroVideo', maxCount: 1 },
// ]), async (req, res) => {
//   const body = req.body || {}
//   const files = req.files || {}

//   const payload = {
//     slug: body.slug,
//     title: body.title,
//     description: body.description,
//     genre: body.genre,
//     tag: body.tag || 'original',
//     youtubeUrl: body.youtubeUrl,
//     awards: (body.awards || '').split(',').map(s => s.trim()).filter(Boolean),
//     cast: (body.cast || '').split(',').map(s => s.trim()).filter(Boolean),
//     thumbnail: files.thumbnail?.[0] ? `/uploads/${files.thumbnail[0].filename}` : body.thumbnail,
//     poster: files.poster?.[0] ? `/uploads/${files.poster[0].filename}` : body.poster,
//     isHero: body.isHero === 'true' || body.isHero === true,
//     heroVideo: files.heroVideo?.[0]
//       ? `/uploads/${files.heroVideo[0].filename}`
//       : (body.heroVideo || ''), // allow remote MP4 URL
//   }
//   try {
//     // if new show is marked hero, unset previous
//     if (payload.isHero) await Show.updateMany({ isHero: true }, { $set: { isHero: false } })
//     const created = await Show.create(payload)
//     res.status(201).json(created)
//   } catch (e) {
//     res.status(400).json({ error: e.message })
//   }
// })

// // NEW: mark a show as hero and (optionally) upload/replace trailer
// r.post('/:id/hero', requireAdmin, upload.single('heroVideo'), async (req, res) => {
//   const id = req.params.id
//   const update = { isHero: true }
//   if (req.file) update.heroVideo = `/uploads/${req.file.filename}`
//   if (req.body.heroVideo) update.heroVideo = req.body.heroVideo // accept remote URL

//   await Show.updateMany({ isHero: true }, { $set: { isHero: false } })
//   const doc = await Show.findByIdAndUpdate(id, update, { new: true })
//   res.json(doc)
// })


r.post(
  '/',
  requireAdmin,
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'poster', maxCount: 1 },
  ]),
  async (req,res)=>{
    const body = req.body || {}
    const files = req.files || {}

    const payload = {
      slug: body.slug,
      title: body.title,
      description: body.description,
      genre: body.genre,
      tag: body.tag || 'original',
      youtubeUrl: body.youtubeUrl,
      awards: (body.awards || '').split(',').map(s=>s.trim()).filter(Boolean),
      cast: (body.cast || '').split(',').map(s=>s.trim()).filter(Boolean),
      thumbnail: files.thumbnail?.[0] ? `/uploads/${files.thumbnail[0].filename}` : body.thumbnail,
      poster:    files.poster?.[0]    ? `/uploads/${files.poster[0].filename}`    : body.poster,

      // NEW:
      isHero: body.isHero === 'true',
          inHeroReel: body.inHeroReel === 'true',
      heroVideo: body.heroTrailerUrl || '', // store as string URL
    }

    try {
      const created = await Show.create(payload)
      res.status(201).json(created)
    } catch (e) {
      res.status(400).json({ error: e.message })
    }
  }
)

// Set/Update HERO and (optionally) trailer URL
r.post('/:id/hero', requireAdmin, async (req,res)=>{
  const { heroVideo, heroVideoUrl } = req.body // allow either key name
  const newUrl = heroVideoUrl || heroVideo

  // turn off current hero
  await Show.updateMany({ isHero: true }, { $set: { isHero: false } })

  // set new hero and optional trailer URL
  const setObj = { isHero: true }
  if (newUrl) setObj.heroVideo = newUrl

  const updated = await Show.findByIdAndUpdate(
    req.params.id,
    { $set: setObj },
    { new: true }
  )

  res.json(updated)
})

// Get current hero
r.get('/hero/current', async (req,res)=>{
  const hero = await Show.findOne({ isHero:true }).lean()
  res.json(hero || null)
})

// Toggle add/remove from reel (and optionally set a trailer url)
r.post('/:id/reel', requireAdmin, async (req,res)=>{
  const { inHeroReel, heroVideoUrl } = req.body
  const set = {}
  if (typeof inHeroReel !== 'undefined') set.inHeroReel = !!(inHeroReel === true || inHeroReel === 'true')
  if (heroVideoUrl) set.heroVideo = heroVideoUrl
  const updated = await Show.findByIdAndUpdate(req.params.id, { $set: set }, { new: true })
  res.json(updated)
})

// Return only curated reel items (most-recent first)
r.get('/hero/reel', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '6', 10), 12)
  const list = await Show.find({
    inHeroReel: true,
    heroVideo: { $exists: true, $ne: '' }
  })
    .sort({ updatedAt: -1 })
    .select('title slug heroVideo')
    .limit(limit)
    .lean()
  res.json(list)
})

// Admin delete
r.delete('/:id', requireAdmin, async (req,res) => {
  await Show.findByIdAndDelete(req.params.id)
  res.json({ ok: true })
})

export default r
