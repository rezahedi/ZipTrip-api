import { Response, Request } from 'express'
import { StatusCodes } from 'http-status-codes'
import CustomAPIError from '../../errors/custom_error'
import { fetchDirection } from '../../utils/googlePlace'
import PlanSchema, { IPlan } from '../../models/Plans'

const updateDirection = async (req: Request, res: Response) => {
  const { planId } = req.params
  if (!planId) throw new CustomAPIError('Provide plan id', StatusCodes.BAD_REQUEST)

  const plan: IPlan | null = await PlanSchema.findById(planId)
  if (!plan) throw new CustomAPIError('Plan not found', StatusCodes.NOT_FOUND)

  if (plan.stops.length < 2) throw new CustomAPIError('Plan should have at least 2 stops', StatusCodes.BAD_REQUEST)

  const stopsLocation = plan.stops.map((s) => s.location)

  const direction = await fetchDirection(stopsLocation)

  if (!direction) throw new CustomAPIError('Unable to fetch direction', StatusCodes.INTERNAL_SERVER_ERROR)

  // Update plan with direction details
  plan.polyline = direction.polyline
  plan.distance = Math.round((direction.distanceMeters / METER_PER_MILE) * 100) / 100 // convert meters to miles with two decimals
  plan.duration = Math.round((direction.durationSeconds / SECOND_PER_HOUR + plan.stopCount) * 100) / 100 // Convert seconds to hours + one hour for each stops
  await plan.save()

  res.status(StatusCodes.OK).json(direction)
}

export { updateDirection }
