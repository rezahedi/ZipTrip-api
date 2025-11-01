import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import favicon from 'express-favicon'
import logger from 'morgan'
import router from './routes/mainRouter'
import authRouter from './routes/auth'
import allNearbyRouter from './routes/allNearby'
import plansRouter from './routes/plans'
import placesRouter from './routes/places'
import accountRouter from './routes/account'
import imagesRouter from './routes/images'
import swaggerUI from 'swagger-ui-express'
import YAML from 'yamljs'
import dbMiddleware from './middlewares/dbMiddleware'
import authMiddleware, { optionalAuthMiddleware } from './middlewares/authMiddleware'
import errorHandlerMiddleware from './middlewares/errorHandlerMiddleware'
import notFoundMiddleware from './middlewares/notFoundMiddleware'
import path from 'path'
import multer from 'multer'

const upload = multer({ storage: multer.memoryStorage() })
const app = express()

// middleware
app.use(cors())
app.use(logger('dev'))
app.use(express.static('public'))
app.use(favicon(__dirname + '/public/favicon.ico'))
app.use(dbMiddleware)

// TODO: Should setup some security middlewares like: rate limiter, helmet, xss ...

// routes
app.use('/api/v1', express.json(), router)
app.use('/api/v1/all', express.json(), allNearbyRouter)
app.use('/api/v1/plans', express.json(), optionalAuthMiddleware, plansRouter)
app.use('/api/v1/places', express.json(), optionalAuthMiddleware, placesRouter)
app.use('/api/v1/auth', express.json(), authRouter)
app.use('/api/v1/account', express.json(), authMiddleware, accountRouter)

// Routes with Multer form-data parser
app.use('/api/v1/account', upload.single('image'), authMiddleware, imagesRouter)

const swaggerPath = path.join(process.cwd(), 'public', 'swagger.yaml')
const swaggerDocument = YAML.load(swaggerPath)
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument))

app.use(notFoundMiddleware)
app.use(errorHandlerMiddleware)

export default app
