import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import PlanSchema, { IPlan } from '../models/Plans'
import StopSchema, { IStop } from '../models/Stops'
import mongoose from 'mongoose'

const fetchAllPlans = async (req: Request, res: Response) => {

  if (!req.user) throw new Error('Authentication Invalid')

  const filters = {
    userId: req.user.userId,
  }

  // TODO: Add pagination support later

  const plans = await PlanSchema.find(filters).populate('categoryId', 'name').populate('userId', 'name')

  res.status(StatusCodes.OK).json({
    page: 1,
    size: 10,
    items: plans,
  })
}
// interface createNewPlanBodyType {
//   body: IPlan & {
//     stops: IStop[]
//   }
// }
const createNewPlan = async (req: Request, res: Response) => {

  if (!req.user) throw new Error('Authentication Invalid')

  const userId: string = req.user.userId
  let { stops, ...plan } = req.body

  const createdPlan: IPlan = await PlanSchema.create({
    ...plan,
    userId,
  })

  if (!createdPlan) throw new Error('Failed to create plan')

  if (stops.length) {
    stops = stops.map((stop: IStop) => ({
      ...stop,
      planId: createdPlan._id,
      userId: new mongoose.Types.ObjectId(userId),
    }))
  }

  const createdStops = await StopSchema.create(stops)

  res.status(StatusCodes.CREATED).json({ plan: createdPlan, stops: createdStops })
}

const fetchPlan = (req: Request, res: Response) => {
  // TODO: Fetch a plan with all stops if had any.

  res.json({
    msg: 'DRAFT - fetch a plan',
  })
}

const updatePlan = (req: Request, res: Response) => {
  // TODO: Update a plan's details.

  res.json({
    msg: 'DRAFT - update a plan',
  })
}

const ChangePlanStatus = (req: Request, res: Response) => {
  // TODO: Change a plan's status to published or pending.

  res.json({
    msg: 'DRAFT - change a plan status',
  })
}

const deletePlan = (req: Request, res: Response) => {
  // TODO: Delete a plan with all associated stops.

  res.json({
    msg: 'DRAFT - delete a plan',
  })
}

export { fetchAllPlans, createNewPlan, fetchPlan, updatePlan, ChangePlanStatus, deletePlan }
