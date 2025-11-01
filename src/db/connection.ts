import mongoose from 'mongoose'

let isConnected = false // track the connection state

const connectDB = async (url: string) => {
  if (!url) {
    throw new Error('Database connection string is undefined. Check your environment variables.')
  }

  if (isConnected) {
    // Reuse existing connection
    return
  }

  const db = await mongoose.connect(url, {
    serverSelectionTimeoutMS: 5000,
  })
  isConnected = db.connections[0].readyState === 1
  console.log('MongoDB connected')
}

export { connectDB }
