import express from 'express'
import { getAllPlans, getPlan, getUserPlans, getCategoryPlans } from '../controllers/plans'

const router = express.Router()

router.route('/').get(getAllPlans)
router.route('/plan/:planId').get(getPlan)
router.route('/user/:userId').get(getUserPlans)
router.route('/category/:categoryId').get(getCategoryPlans)

export default router
