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
import {
  fetchLists,
  fetchAList,
  createNewList,
  removeList,
  addPlaceToList,
  removePlaceFromList,
} from '../controllers/account/lists'

const router = express.Router()

router.route('/list').get(fetchLists).post(createNewList)
router.route('/list/:listId').get(fetchAList).delete(removeList)
router.route('/list/:listId/:placeId').post(addPlaceToList).delete(removePlaceFromList)
router.route('/plans/').get(fetchAllPlans).post(createNewPlan)
router.route('/plans/:planId').get(fetchPlan).put(updatePlan).delete(deletePlan)
router.route('/bookmarks').get(fetchAllBookmarkedPlans)
router.route('/bookmarks/:planId').post(addBookmark).delete(removeBookmark)

export default router
