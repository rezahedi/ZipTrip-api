import { loadEnv } from './utils/loadEnv'

loadEnv()
const { PORT = 8000 } = process.env
import app from './app'

const listener = async () => {
  try {
    app.listen(PORT, () => {
      console.log(`Server is listening on port ${PORT}...`)
    })
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

listener()
