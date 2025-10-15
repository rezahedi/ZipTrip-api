import express from 'express'
import {
  fetchAllPlans,
  createNewPlan,
  fetchPlan,
  updatePlan,
  deletePlan,
  fetchAllBookmarkedPlans,
  addBookmark,
  removeBookmark,
} from '../controllers/account'
import { createNewCity } from '../controllers/account/cities'

const router = express.Router()

router.route('/plans/').get(fetchAllPlans).post(createNewPlan)
router.route('/plans/:planId').get(fetchPlan).put(updatePlan).delete(deletePlan)
router.route('/bookmarks').get(fetchAllBookmarkedPlans)
router.route('/bookmarks/:planId').post(addBookmark).delete(removeBookmark)

router.route('/cities').post(createNewCity)

export default router
