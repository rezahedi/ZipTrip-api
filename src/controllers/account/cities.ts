import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import CitySchema, { ICity } from '../../models/Cities'
import UnauthenticatedError from '../../errors/unauthentication_error'
import CustomAPIError from '../../errors/custom_error'
import { v2 as cloudinary } from 'cloudinary'
import { AddressComponents } from '../../types/googlePlaces'
import { coordsToGeoJson, geoJsonToCoords } from '../../utils/location'

type CityDTO = Pick<ICity, 'placeId' | 'name'>

const createNewCity = async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthenticatedError('Not authorized to access.')

  let city: CityDTO = req.body
  let cityDoc: ICity | null = await CitySchema.findOne({ placeId: city.placeId }).lean()

  // Check in cities collection, if city document with placeId exist but not updated or do not exist at all
  if ((cityDoc && !cityDoc.country && !cityDoc.location) || !cityDoc) {
    // fetch place details
    const apiKey = process.env.GOOGLE_MAPS_API_KEY as string
    if (!apiKey) throw new CustomAPIError('Google Places API key is not configured', StatusCodes.INTERNAL_SERVER_ERROR)
    const fields = 'displayName,photos,location,viewport,addressComponents'
    const url = `https://places.googleapis.com/v1/places/${city.placeId}?fields=${fields}&key=${apiKey}`
    console.log(url)

    const response = await fetch(url)
    if (response.ok) {
      const data = await response.json()

      // Get Image and Store it
      let imageURL = cityDoc?.imageURL
      if (!imageURL && data.photos.length > 0) {
        // Get first photo and generate the url
        const googleImageURL = `https://places.googleapis.com/v1/${data.photos[0].name}/media?maxHeightPx=400&maxWidthPx=400&key=${process.env.GOOGLE_MAPS_API_KEY}`
        // Then upload the image on Cloudinary and get back the new image URL
        const { secure_url } = await cloudinary.uploader.upload(googleImageURL, {
          folder: 'ZipTrip/Places',
          overwrite: true,
          invalidate: true,
        })
        imageURL = secure_url
      }

      // Short Name
      const name = data.displayName.text || city.name

      // Get State
      const stateComponent = data.addressComponents.find((c: AddressComponents) =>
        c.types.includes('administrative_area_level_1')
      )
      const state = stateComponent.longText || ''

      // Get Country
      const countryComponent = data.addressComponents.find((c: AddressComponents) => c.types.includes('country'))
      const country = countryComponent.longText || ''

      // Map Viewport
      const viewport = {
        low: [data.viewport.low.latitude, data.viewport.low.longitude],
        high: [data.viewport.high.latitude, data.viewport.high.longitude],
      }

      // Then update the city document in Mongodb with new data
      // if doc with placeId exist update, if not create doc
      const res = await CitySchema.updateOne(
        { placeId: city.placeId },
        {
          $set: {
            name,
            imageURL,
            viewport,
            ...(state && { state }),
            ...(country && { country }),
            location: coordsToGeoJson([data.location.latitude, data.location.longitude]),
          },
        },
        { upsert: true }
      )
      if (!res) throw new CustomAPIError('Failed to create or update the city', StatusCodes.INTERNAL_SERVER_ERROR)

      cityDoc = await CitySchema.findOne({ placeId: city.placeId }).lean()
    }
    throw new CustomAPIError('Failed to fetch place details from Google Places API', StatusCodes.INTERNAL_SERVER_ERROR)
  }

  res.status(StatusCodes.CREATED).json({
    ...cityDoc,
    location: geoJsonToCoords(cityDoc.location),
  })
}

export { createNewCity }
