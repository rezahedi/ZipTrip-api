type GooglePlace = {
  id: string
  displayName: {
    text: string
  }
  shortFormattedAddress: string
  formattedAddress: string
  addressComponents: AddressComponents[]
  location: {
    latitude: number
    longitude: number
  }
  primaryType: string
  iconMaskBaseUri: string
  iconBackgroundColor: string
  photos: Photo[]
  editorialSummary: {
    text: string
  }
  generativeSummary: {
    overview: {
      text: string
    }
  }
  reviewSummary: {
    text: {
      text: string
    }
  }
  rating: number
  userRatingCount: number
}

type AddressComponents = {
  longText: string
  shortText: string
  types: string[]
}

type Photo = {
  imageURL?: string
  name: string
}

export const transformGooglePlaceToSchema = (data: GooglePlace) => {
  // Get Name
  const name = data.displayName.text

  // Get State
  const stateComponent: AddressComponents | undefined = data.addressComponents?.find((c: AddressComponents) =>
    c.types?.includes('administrative_area_level_1')
  )
  const state = stateComponent?.longText || ''

  // Get Country
  const countryComponent: AddressComponents | undefined = data.addressComponents?.find((c: AddressComponents) =>
    c.types?.includes('country')
  )
  const country = countryComponent?.longText || ''

  // Get first image as imageURL
  const imageURL = data.photos.length > 0 ? data.photos[0].imageURL : ''

  // Get Address
  const address = data.shortFormattedAddress || data.formattedAddress || ''

  // Get Location
  const location = [data.location.latitude, data.location.longitude]

  // Get Type
  const type = data.primaryType || ''

  // Get Icon URL
  const iconURL = data.iconMaskBaseUri

  // Get Icon Background Color
  const iconBackground = data.iconBackgroundColor

  // Get Summary
  const summary = data.editorialSummary?.text || data.generativeSummary?.overview?.text || ''

  // Get Review Summary
  const reviewSummary = data.reviewSummary?.text?.text || ''

  // Get Rating
  const rating = Number(data.rating || '0')

  // Get User Rating Count
  const userRatingCount = Number(data.userRatingCount || '0')

  return {
    placeId: data.id,
    name,
    state,
    country,
    imageURL,
    address,
    location,
    type,
    iconURL,
    iconBackground,
    summary,
    reviewSummary,
    rating,
    userRatingCount,
  }
}

export const fetchCityDetail = async (cityId: string) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY as string
  if (!apiKey) throw new Error('Google Places API key is not configured')
  const fields = 'displayName,photos,location,viewport,addressComponents'
  const url = `https://places.googleapis.com/v1/places/${cityId}?fields=${fields}&key=${apiKey}`

  const response = await fetch(url)

  if (response.ok) {
    const data = await response.json()

    // Get Image and Store it
    const imageURL =
      data.photos.length > 0
        ? `https://places.googleapis.com/v1/${data.photos[0].name}/media?maxHeightPx=400&maxWidthPx=400&key=${process.env.GOOGLE_MAPS_API_KEY}`
        : ''

    // Short Name
    const name = data.displayName.text

    // Get State
    const stateComponent = data.addressComponents.find((c: AddressComponents) =>
      c.types.includes('administrative_area_level_1')
    )
    const state = stateComponent.longText || ''

    // Get Country
    const countryComponent = data.addressComponents.find((c: AddressComponents) => c.types.includes('country'))
    const country = countryComponent.longText || ''

    // Get Location
    const location = [data.location.latitude, data.location.longitude]

    // Map Viewport
    const viewport = {
      low: [data.viewport.low.latitude, data.viewport.low.longitude],
      high: [data.viewport.high.latitude, data.viewport.high.longitude],
    }

    return {
      placeId: cityId,
      name,
      imageURL,
      location,
      viewport,
      state,
      country,
    }
  } else throw new Error("Couldn't fetch the city's detail from Google Place API")
}
