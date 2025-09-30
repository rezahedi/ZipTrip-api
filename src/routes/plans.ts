import express from 'express'
import {
  fetchAllPlans,
  fetchPlan,
  fetchUserWithPlans,
  fetchCategoryWithPlans,
  fetchAllCategories,
  fetchAllNearbyPlans,
} from '../controllers/plans'

const router = express.Router()

router.route('/').get(fetchAllPlans)
// Specific routes first
router.route('/category').get(fetchAllCategories)
router.route('/user/:userId').get(fetchUserWithPlans)
router.route('/category/:categoryId').get(fetchCategoryWithPlans)

router.route('/nearby').get(fetchAllNearbyPlans)

// Generic route last to avoid conflicts
router.route('/:planId').get(fetchPlan)

export default router
