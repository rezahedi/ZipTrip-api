import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import PlanSchema from '../models/Plans'
import UserSchema, { IUser } from '../models/Users'
import CategorySchema, { ICategory } from '../models/Categories'

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

const fetchCategoryWithPlans = async (req: Request, res: Response) => {
  const { categoryId } = req.params
  const { page = 1, size = PAGE_SIZE } = req.query

  const pageSize: number = parseInt(size as string)
  const pageNumber: number = (parseInt(page as string) - 1) * pageSize

  const category: ICategory | null = await CategorySchema.findById(categoryId).lean()

  const filters = {
    categoryId,
  }

  const plans = await PlanSchema.find(filters)
    .populate('categoryId', 'name')
    .populate('userId', 'name')
    .skip(pageNumber)
    .limit(pageSize)

  res.status(StatusCodes.OK).json({
    ...category,
    plans: {
      page: pageNumber,
      size: pageSize,
      items: plans,
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
