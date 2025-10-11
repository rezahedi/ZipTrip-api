import express from 'express'
import { addImageToPlan } from '../controllers/account'

const router = express.Router()

router.route('/plans/:planId/image').post(addImageToPlan)

export default router
