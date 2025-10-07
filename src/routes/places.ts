import express from 'express'
import { fetchAllPlaces, fetchPlace, fetchAllNearbyPlaces, fetchGooglePlace } from '../controllers/places'

const router = express.Router()

router.route('/').get(fetchAllPlaces)
// Specific routes first
router.route('/nearby').get(fetchAllNearbyPlaces)
router.route('/fetch/:googlePlaceId').get(fetchGooglePlace)

// Generic route last to avoid conflicts
router.route('/:placeId').get(fetchPlace)

export default router
