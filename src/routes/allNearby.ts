import express from 'express'
import { fetchAllNearby } from '../controllers/allNearby'

const router = express.Router()

router.route('/').get(fetchAllNearby)

export default router
