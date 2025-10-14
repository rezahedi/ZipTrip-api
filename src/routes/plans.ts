import express from 'express'
import { fetchAllPlans, fetchPlan, fetchUserWithPlans, fetchAllNearbyPlans } from '../controllers/plans'
import { fetchCityWithPlans, fetchAllCities } from '../controllers/cities'

const router = express.Router()

router.route('/').get(fetchAllPlans)
// Specific routes first
router.route('/city').get(fetchAllCities)
router.route('/city/:cityId').get(fetchCityWithPlans)
router.route('/user/:userId').get(fetchUserWithPlans)

router.route('/nearby').get(fetchAllNearbyPlans)

// Generic route last to avoid conflicts
router.route('/:planId').get(fetchPlan)

export default router
