import { IPlan } from '../models/Plans'
import BookmarkSchema from '../models/Bookmarks'

export const attachBookmarkFlagToPlans = async (plans: IPlan[], userId: string) => {
  if (!userId)
    return plans.map((plan) => ({
      ...plan,
      isBookmarked: false,
    }))

  // Extract only plan IDs
  const planIds = plans.map((plan) => plan._id)

  // Get plan IDs from bookmarks collection based on userId
  const bookmarks = await BookmarkSchema.find({
    userId,
    planId: { $in: planIds },
  }).select('planId')

  // Create a Set for fast lookup
  const bookmarkedPlanIds = new Set(bookmarks.map((b) => b.planId.toString()))

  // Attach isBookmarked state to each plan
  return plans.map((plan) => ({
    ...plan,
    isBookmarked: bookmarkedPlanIds.has(plan._id.toString()),
  }))
}
