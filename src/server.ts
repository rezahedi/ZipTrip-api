import dotenv from 'dotenv'
dotenv.config()
const { PORT = 8000 } = process.env
import app from './app'
import { connectDB } from './db/connection'

const listener = async () => {
  try {
    await connectDB(`${process.env.MONGO_URI}`)
    app.listen(PORT, () => {
      console.log(`Server is listening on port ${PORT}...`)
    })
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

listener()
