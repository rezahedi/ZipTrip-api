import express from 'express'
import {
  fetchAllPlans,
  createNewPlan,
  fetchPlan,
  updatePlan,
  deletePlan,
  fetchAllCategories,
  createNewCategory,
} from '../controllers/account'
import { createNewStop, fetchStop, updateStop, deleteStop } from '../controllers/stops'

const router = express.Router()

router.route('/plans/').get(fetchAllPlans).post(createNewPlan)
router.route('/plans/:planId').get(fetchPlan).put(updatePlan).delete(deletePlan)
// TODO: Add POST /:planId/stops endpoint to the swagger.yaml file.
router.route('/plans/:planId/stops').post(createNewStop)
router.route('/plans/:planId/stops/:stopId').get(fetchStop).put(updateStop).delete(deleteStop)
router.route('/categories').get(fetchAllCategories).post(createNewCategory)

export default router
