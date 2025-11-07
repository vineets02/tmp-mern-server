import mongoose from 'mongoose'

const ShowSchema = new mongoose.Schema({
  slug: { type: String, unique: true, required: true },
  title: { type: String, required: true },
  description: String,
  genre: String,
  tag: String,
  thumbnail: String,
  poster: String,
  youtubeUrl: String,
  awards: [String],
  cast: [String],
   isHero: { type: Boolean, default: false },   // featured on home
   inHeroReel: { type: Boolean, default: false },
  heroVideo: String, 
}, { timestamps: true })

export default mongoose.model('Show', ShowSchema)
