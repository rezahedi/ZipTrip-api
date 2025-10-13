// In your main app file or a dedicated cloudinary config file
import { v2 as cloudinary } from 'cloudinary'
import { loadEnv } from './utils/loadEnv'

loadEnv()

cloudinary.config({ secure: true })
