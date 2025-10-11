// In your main app file or a dedicated cloudinary config file
import { v2 as cloudinary } from 'cloudinary'
import dotenv from 'dotenv'
dotenv.config()

cloudinary.config({ secure: true })
