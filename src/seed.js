import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Show from './models/Show.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tvfdb'

async function run () {
  await mongoose.connect(MONGO_URI)
  const seedPath = path.join(__dirname, 'data', 'shows.seed.json')
  const items = JSON.parse(fs.readFileSync(seedPath, 'utf-8'))
  await Show.deleteMany({})
  await Show.insertMany(items)
  console.log(`Seeded ${items.length} shows.`)
  await mongoose.disconnect()
}

run().catch(err => { console.error(err); process.exit(1) })
