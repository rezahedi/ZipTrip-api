import { Request, Response } from 'express'
import ListSchema, { IList } from '../../models/Lists'
import UnauthenticatedError from '../../errors/unauthentication_error'
import { StatusCodes } from 'http-status-codes'
import CustomAPIError from '../../errors/custom_error'
import { Types } from 'mongoose'
import NotFoundError from '../../errors/not_found'

const fetchLists = async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthenticatedError('Not authorized to access.')

  const filters = {
    userId: req.user.userId,
  }

  const lists = await ListSchema.find(filters).select('name placeIDs').lean()

  res.status(StatusCodes.OK).json(lists)
}

const fetchAList = async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthenticatedError('Not authorized to access.')

  const userId = req.user.userId
  const listId = req.params.listId

  const filters = {
    userId,
    _id: new Types.ObjectId(listId),
  }

  const listWithPlaces: IList | null = await ListSchema.findOne(filters).select('name placeDetails').lean()

  if (!listWithPlaces) throw new NotFoundError(`No list with id ${listId}`)

  res.status(StatusCodes.OK).json(listWithPlaces)
}

const createNewList = async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthenticatedError('Not authorized to access.')

  const userId: string = req.user.userId
  let { name } = req.body

  const createdList: IList = await ListSchema.create({
    name,
    userId,
  })

  if (!createdList) throw new CustomAPIError('Failed to create new list', StatusCodes.INTERNAL_SERVER_ERROR)

  res.status(StatusCodes.CREATED).json(createdList.toJSON())
}

const removeList = async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthenticatedError('Not authorized to access.')

  const userId: string = req.user.userId
  let { listId } = req.params

  const result = await ListSchema.findByIdAndDelete({
    _id: listId,
    userId,
  })

  if (!result) {
    throw new NotFoundError(`No list with id ${listId}`)
  }

  res.status(StatusCodes.NO_CONTENT).end()
}

const addPlaceToList = async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthenticatedError('Not authorized to access.')

  const userId: string = req.user.userId
  const { listId } = req.params
  const place = req.body

  if (!place) throw new CustomAPIError('Provide place details', StatusCodes.BAD_REQUEST)

  const list = await ListSchema.findOne({ _id: listId, userId })

  if (!list) throw new NotFoundError(`No list with id ${listId}`)

  if (list.placeIDs.includes(place.placeId))
    throw new CustomAPIError('Place is already in the list', StatusCodes.BAD_REQUEST)

  list.placeIDs.push(place.placeId)
  list.placeDetails.push(place)
  const updatedList = await list.save()

  if (!updatedList) throw new CustomAPIError('Failed to add place to the list', StatusCodes.INTERNAL_SERVER_ERROR)

  res.status(StatusCodes.CREATED).json(updatedList.toJSON())
}

const removePlaceFromList = async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthenticatedError('Not authorized to access.')

  const userId: string = req.user.userId
  const { listId, placeId } = req.params

  const list = await ListSchema.findOne({ _id: listId, userId })

  if (!list) throw new NotFoundError(`No list with id ${listId}`)

  if (!list.placeIDs.includes(placeId)) throw new CustomAPIError('Place is not in the list', StatusCodes.BAD_REQUEST)

  list.placeIDs = list.placeIDs.filter((id) => id !== placeId)
  list.placeDetails = list.placeDetails.filter((p) => p.placeId !== placeId)

  const updatedList = await list.save()

  if (!updatedList) throw new CustomAPIError('Failed to remove place from the list', StatusCodes.INTERNAL_SERVER_ERROR)

  res.status(StatusCodes.CREATED).json(updatedList.toJSON())
}

export { fetchLists, fetchAList, createNewList, removeList, addPlaceToList, removePlaceFromList }
