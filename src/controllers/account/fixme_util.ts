import { IPlan } from '../../models/Plans'
import { geoJsonToCoords } from '../../utils/location'
import PlaceSchema from '../../models/Places'
import CitySchema from '../../models/Cities'

// FIXME: Use ref in plan schema to reference cities to City and stops to Place collection and use the ref to populate instead of this below logic

export default async function fixme_populatePlan(plan: IPlan) {
  // Get all cityIDs of stops in an array
  const cityIds = plan.cities.map((c) => c.placeId)
  // Select all cities by the ids
  const unorderedCities = await CitySchema.find({
    placeId: { $in: cityIds },
  })
    .select('placeId name state country imageURL location viewport plans')
    .lean()

  // Make sure the order of cities is the same as plan.cities
  const cities = plan.cities.map((city) => {
    const res = unorderedCities.find((c) => city.placeId === c.placeId)
    return {
      ...res,
      location: geoJsonToCoords(res?.location),
    }
  })

  // Get all placeIDs of stops in an array
  const placeIds = plan.stops.map((stop) => stop.placeId)
  // Select all places by the ids
  const unorderedPlaces = await PlaceSchema.find({
    placeId: { $in: placeIds },
  })
    .select('placeId state country summary type rating userRatingCount reviewSummary directionGoogleURI placeGoogleURI')
    .lean()

  // Make sure the order of places is the same as plan.stops
  const places = plan.stops.map((stop) => {
    const placeDetail = unorderedPlaces.find((place) => stop.placeId === place.placeId)
    return {
      ...stop,
      ...placeDetail,
    }
  })

  return {
    ...plan,
    cities: cities,
    stops: places,
    startLocation: geoJsonToCoords(plan.startLocation),
    finishLocation: geoJsonToCoords(plan.finishLocation),
  }
}
