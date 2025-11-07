import { Router } from 'express'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config()

const r = Router()

r.post('/login', (req, res) => {
  const { username, password } = req.body || {}
  const u = process.env.ADMIN_USER || 'admin@example.com'
  const p = process.env.ADMIN_PASS || 'admin123'
  if (username === u && password === p) {
    const token = jwt.sign({ role: 'admin', username }, process.env.JWT_SECRET || 'dev', { expiresIn: '8h' })
    return res.json({ token })
  }
  return res.status(401).json({ error: 'Invalid credentials' })
})

export default r
