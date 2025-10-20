import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import CitySchema, { ICity } from '../../models/Cities'
import UnauthenticatedError from '../../errors/unauthentication_error'
import CustomAPIError from '../../errors/custom_error'
import { coordsToGeoJson, geoJsonToCoords } from '../../utils/location'
import { fetchCityDetail } from '../../utils/googlePlace'
import { uploadImage } from '../../utils/cloudStorage'

type CityDTO = Pick<ICity, 'placeId' | 'name'>

const createNewCity = async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthenticatedError('Not authorized to access.')

  let city: CityDTO = req.body
  let cityDoc: ICity | null = await CitySchema.findOne({ placeId: city.placeId }).lean()

  // Fetch city details if city does not exist or missing some details
  if (!cityDoc || (cityDoc && !cityDoc.country && !cityDoc.location)) {
    let cityDetail = await fetchCityDetail(city.placeId)

    // Store the image
    cityDetail.imageURL = cityDoc?.imageURL || (await uploadImage(cityDetail.imageURL)) || ''

    // Then update the city document in Mongodb with new data
    // if doc with placeId exist update, if not create doc
    await CitySchema.updateOne(
      { placeId: city.placeId },
      {
        $set: {
          ...cityDetail,
          location: coordsToGeoJson(cityDetail.location),
        },
      },
      { upsert: true }
    ).orFail(new CustomAPIError('Failed to create or update the city', StatusCodes.INTERNAL_SERVER_ERROR))

    cityDoc = await CitySchema.findOne({ placeId: city.placeId }).lean()
  }

  res.status(StatusCodes.CREATED).json({
    ...cityDoc,
    location: geoJsonToCoords(cityDoc?.location),
  })
}

export { createNewCity }
