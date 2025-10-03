import express from 'express'
import { fetchAllPlaces, fetchPlace, fetchAllNearbyPlaces } from '../controllers/places'

const router = express.Router()

router.route('/').get(fetchAllPlaces)
// Specific routes first
router.route('/nearby').get(fetchAllNearbyPlaces)

// Generic route last to avoid conflicts
router.route('/:placeId').get(fetchPlace)

export default router
