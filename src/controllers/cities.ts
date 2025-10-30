import { coordsToGeoJson } from './../utils/location'
import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import CitySchema, { ICity } from '../models/Cities'
import PlanSchema from '../models/Plans'
import NotFoundError from '../errors/not_found'
import { geoJsonToCoords } from '../utils/location'
import { fetchCityDetail } from '../utils/googlePlace'
import { uploadImage } from '../utils/cloudStorage'
import CustomAPIError from '../errors/custom_error'
import { attachBookmarkFlagToPlans } from './util'

const PAGE_SIZE = 10
const SORT = '-plans'

type CityDTO = Pick<ICity, 'placeId' | 'name'>

const createNewCity = async (req: Request, res: Response) => {
  let city: CityDTO = req.body
  let cityDoc: ICity | null = await CitySchema.findOne({ placeId: city.placeId }).lean()

  // Fetch city details if city does not exist or missing some details
  if (!cityDoc || (cityDoc && !cityDoc.country && !cityDoc.location)) {
    let cityDetail = await fetchCityDetail(city.placeId)

    // Store the image
    cityDetail.imageURL = cityDoc?.imageURL || (await uploadImage(cityDetail.imageURL)) || ''

    // Then update the city document in Mongodb with new data
    // if doc with placeId exist update, if not create doc
    const result = await CitySchema.updateOne(
      { placeId: city.placeId },
      {
        $set: {
          ...cityDetail,
          location: coordsToGeoJson(cityDetail.location),
        },
      },
      { upsert: true }
    )
    if (result.matchedCount === 0 && result.upsertedCount === 0)
      throw new CustomAPIError('Failed to create or update the city', StatusCodes.INTERNAL_SERVER_ERROR)

    cityDoc = await CitySchema.findOne({ placeId: city.placeId }).lean()
  }

  res.status(StatusCodes.CREATED).json({
    ...cityDoc,
    location: geoJsonToCoords(cityDoc?.location),
  })
}

const fetchAllCities = async (req: Request, res: Response) => {
  const { search, cityId, page = '1', size = PAGE_SIZE, sort = SORT } = req.query

  const filters = {
    ...(search && {
      name: { $regex: search, $options: 'i' },
    }),
    ...(cityId && { placeId: cityId }),
  }

  const pageSize: number = parseInt(size as string)
  const pageNumber: number = (parseInt(page as string) - 1) * pageSize

  const totalItems = await CitySchema.countDocuments(filters)
  const pagesCount = Math.ceil(totalItems / pageSize)

  const cities = await CitySchema.find(filters)
    .select('placeId name state country imageURL plans')
    .skip(pageNumber)
    .limit(pageSize)
    .sort(sort as string)
    .lean()

  res.status(StatusCodes.OK).json({
    ...{ search, cityId },
    sort,
    page: parseInt(page as string),
    size: pageSize,
    pagesCount,
    items: cities.map((item) => ({
      ...item,
      location: geoJsonToCoords(item.location),
    })),
  })
}

const fetchCityWithPlans = async (req: Request, res: Response) => {
  const { cityId } = req.params
  const { page = '1', size = PAGE_SIZE } = req.query

  const pageSize: number = parseInt(size as string)
  const pageNumber: number = (parseInt(page as string) - 1) * pageSize

  const city: ICity | null = await CitySchema.findOne({ placeId: cityId })
    .orFail(new NotFoundError(`Item not found with the id: ${cityId}`))
    .select('placeId name state country imageURL location viewport')
    .lean()

  // Update city details, if details are missing by fetching from Google Places API
  if (!city?.country && !city?.location) {
    let cityDetail = await fetchCityDetail(cityId)

    // Store the image
    cityDetail.imageURL = city?.imageURL || (await uploadImage(cityDetail.imageURL)) || ''

    // Then update the city document in Mongodb with new data
    await CitySchema.updateOne(
      { placeId: cityId },
      {
        $set: {
          ...cityDetail,
          location: coordsToGeoJson(cityDetail.location),
        },
      }
    )
  }

  const filters = {
    'cities.placeId': cityId,
  }

  const plans = await PlanSchema.find(filters)
    .select('title images cities stopCount type rate reviewCount startLocation finishLocation distance duration')
    .populate('userId', 'name')
    .skip(pageNumber)
    .limit(pageSize)
    .lean()

  const authenticatedUserId = req.user ? req.user.userId : ''
  const plansWithBookmarksStatus = await attachBookmarkFlagToPlans(plans, authenticatedUserId)

  const totalItems = await PlanSchema.countDocuments(filters)
  const pagesCount = Math.ceil(totalItems / pageSize)

  res.status(StatusCodes.OK).json({
    ...city,
    location: geoJsonToCoords(city?.location),
    plans: {
      page: parseInt(page as string),
      size: pageSize,
      pagesCount,
      // TODO: it's not efficient, may combine with attachBookmarkFlagToPlans loop!
      items: plansWithBookmarksStatus.map((item) => ({
        ...item,
        startLocation: geoJsonToCoords(item.startLocation),
        finishLocation: geoJsonToCoords(item.finishLocation),
      })),
    },
  })
}

export { createNewCity, fetchAllCities, fetchCityWithPlans }
