const mongoose = require('mongoose')
import dotenv from 'dotenv';
dotenv.config();

const connectDB = (url: string) => {
  if (!url) {
    throw new Error('Database connection string is undefined. Check your environment variables.')
  }
  return mongoose
    .connect(url, {
      serverSelectionTimeoutMS: 5000,
    })
    .then(() => {
      console.log('Connected to the DB ...')
    })
    .catch((error: string) => {
      console.error('Database connection Error: ', error)
      process.exit(1)
    })
}

export { connectDB }
