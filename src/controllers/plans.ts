import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import PlanSchema from '../models/Plans'
import UserSchema, { IUser } from '../models/Users'
import NotFoundError from '../errors/not_found'

import dummyData from '../dummyData.json'
import { categoryType, planType, stopType, userType } from '../dummyDataTypes'

const dummyPlans: planType[] = dummyData.plans
const dummyStops: stopType[] = dummyData.stops
const dummyCategories: categoryType[] = dummyData.categories
const dummyUsers: userType[] = dummyData.users

const PAGE_SIZE = 10

const fetchAllPlans = async (req: Request, res: Response) => {
  const { search, categoryId, page = 1, size = PAGE_SIZE } = req.query

  const filters = {
    ...(search && {
      title: { $regex: search, $options: 'i' },
    }),
    ...(categoryId && { categoryId }),
  }

  const pageSize: number = parseInt(size as string)
  const pageNumber: number = (parseInt(page as string) - 1) * pageSize

  const plans = await PlanSchema.find(filters)
    .populate('categoryId', 'name')
    .populate('userId', 'name')
    .skip(pageNumber)
    .limit(pageSize)

  res.status(StatusCodes.OK).json({
    ...{ search, categoryId },
    page: 1,
    size: 10,
    items: plans,
  })
}

const fetchUserWithPlans = async (req: Request, res: Response) => {
  const { userId } = req.params
  const { page = 1, size = PAGE_SIZE } = req.query

  const pageSize: number = parseInt(size as string)
  const pageNumber: number = (parseInt(page as string) - 1) * pageSize

  const user: IUser | null = await UserSchema.findById(userId).select('-password').lean()
  console.log(user)

  if (!user) {
    throw new NotFoundError(`User with id ${userId} not found`)
  }

  const filters = {
    userId,
  }

  const plans = await PlanSchema.find(filters)
    .populate('categoryId', 'name')
    .populate('userId', 'name')
    .skip(pageNumber)
    .limit(pageSize)

  res.status(StatusCodes.OK).json({
    ...user,
    plans: {
      page: pageNumber,
      size: pageSize,
      items: plans,
    },
  })
}

const fetchCategoryWithPlans = (req: Request, res: Response) => {
  const { categoryId, page = 1, size = PAGE_SIZE } = req.params

  const category = dummyCategories.find((category: categoryType) => {
    return category.categoryId === categoryId
  })

  if (!category) {
    res.status(404).json({
      error: `Category with id ${categoryId} not found`,
    })
    return
  }

  let resultPlans: planType[] = dummyPlans
  resultPlans = resultPlans.filter((plan: planType) => {
    return plan.categoryId === categoryId
  })

  // Pagination
  const pageNumber = parseInt(page as string)
  const pageSize = parseInt(size as string)
  resultPlans = resultPlans.slice((pageNumber - 1) * pageSize, pageNumber * pageSize)

  res.json({
    ...category,
    plans: {
      page: pageNumber,
      size: pageSize,
      items: resultPlans,
    },
  })
}

const fetchPlan = (req: Request, res: Response) => {
  const { planId } = req.params

  const plan = dummyPlans.find((plan: planType) => {
    return plan.planId === planId
  })

  if (!plan) {
    res.status(400).json({
      error: `Plan with id ${planId} not found`,
    })
    return
  }

  res.json({
    ...plan,
    stops: dummyStops.filter((stop: stopType) => {
      return stop.planId === planId
    }),
  })
}

export { fetchAllPlans, fetchPlan, fetchUserWithPlans, fetchCategoryWithPlans }
