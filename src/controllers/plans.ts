import { Request, Response } from 'express'
import dummyData from '../dummyData.json'
import { categoryType, planType, stopType, userType } from '../dummyDataTypes'

const dummyPlans: planType[] = dummyData.plans
const dummyStops: stopType[] = dummyData.stops
const dummyCategories: categoryType[] = dummyData.categories
const dummyUsers: userType[] = dummyData.users

const getAllPlans = (req: Request, res: Response) => {
  const { categoryId } = req.query
  let resultPlans: planType[] = dummyPlans

  if (categoryId) {
    resultPlans = dummyPlans.filter((plan: planType) => {
      return plan.categoryId === categoryId
    })
  }

  // TODO: Add pagination, sorting, filtering logic

  res.json({
    plans: resultPlans,
  })
}

const getUserPlans = (req: Request, res: Response) => {
  const { userId } = req.params

  const user = dummyUsers.find((user: userType) => {
    return user.userId === userId
  })

  if (!user) {
    res.status(404).json({
      error: `User with id ${userId} not found`,
    })
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = user

  // TODO: Add pagination, sorting, filtering logic

  res.json({
    ...userWithoutPassword,
    plans: dummyPlans.filter((plan: planType) => {
      return plan.userId === userId
    }),
  })
}

const getCategoryPlans = (req: Request, res: Response) => {
  const { categoryId } = req.params

  const category = dummyCategories.find((category: categoryType) => {
    return category.categoryId === categoryId
  })

  if (!category) {
    res.status(404).json({
      error: `Category with id ${categoryId} not found`,
    })
    return
  }

  // TODO: Add pagination, sorting, filtering logic

  res.json({
    ...category,
    plans: dummyPlans.filter((plan: planType) => {
      return plan.categoryId === categoryId
    }),
  })
}

const getPlan = (req: Request, res: Response) => {
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

export { getAllPlans, getPlan, getUserPlans, getCategoryPlans }
