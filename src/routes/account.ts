import express from 'express'
import {
  fetchAllPlans,
  createNewPlan,
  fetchPlan,
  updatePlan,
  deletePlan,
  fetchAllCategories,
  createNewCategory,
  fetchAllBookmarkedPlans,
  bookmarkPlan,
} from '../controllers/account'

const router = express.Router()

router.route('/plans/').get(fetchAllPlans).post(createNewPlan)
router.route('/plans/:planId').get(fetchPlan).put(updatePlan).delete(deletePlan)
router.route('/categories').get(fetchAllCategories).post(createNewCategory)
router.route('/bookmarks').get(fetchAllBookmarkedPlans)
router.route('/bookmarks/:planId').post(bookmarkPlan)

export default router
