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
  googleMapsLinks: Links
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

type Links = {
  directionsUri: string
  placeUri: string
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

  // Get GoogleMap Direction URI
  const directionGoogleURI = data.googleMapsLinks?.directionsUri || ''

  // Get GoogleMap Place URI
  const placeGoogleURI = data.googleMapsLinks?.placeUri || ''

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
    directionGoogleURI,
    placeGoogleURI,
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

export type DirectionResponse = {
  distanceMeters: number
  durationSeconds: number
  polyline: string
}

export const fetchDirection = async (points: [number, number][]): Promise<DirectionResponse | null> => {
  if (points.length < 2) return null

  const apiKey = process.env.GOOGLE_MAPS_API_KEY as string
  if (!apiKey) throw new Error('Google Places API key is not configured')

  const origin = points[0]
  const destination = points[points.length - 1]
  const waypoints = points.slice(1, -1)

  const intermediates = waypoints.map((p) => ({ location: { latLng: { latitude: p[0], longitude: p[1] } } }))

  const url = `https://routes.googleapis.com/directions/v2:computeRoutes`
  const routeRequestBody = {
    origin: {
      location: {
        latLng: {
          latitude: origin[0],
          longitude: origin[1],
        },
      },
    },
    destination: {
      location: {
        latLng: {
          latitude: destination[0],
          longitude: destination[1],
        },
      },
    },
    ...(intermediates.length && { intermediates }),
    travelMode: 'WALK',
    polylineQuality: 'overview',
    routingPreference: 'ROUTING_PREFERENCE_UNSPECIFIED',
    computeAlternativeRoutes: false,
    // routeModifiers: {
    //   avoidTolls: false,
    //   avoidHighways: false,
    //   avoidFerries: false,
    // },
    languageCode: 'en-US',
    // units: 'METRIC | IMPERIAL', // and then access it through field mask: routes.localizedValues.distance.text
  }
  const fields = 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline'

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': fields,
    },
    body: JSON.stringify(routeRequestBody),
  })
  if (response.ok) {
    const data = await response.json()
    if (!data.routes || data.routes.length === 0) return null
    return {
      distanceMeters: data.routes[0].distanceMeters,
      durationSeconds: parseInt(data.routes[0].duration),
      polyline: data.routes[0].polyline.encodedPolyline,
    }
  } else throw new Error('Unable to fetch direction from Google API')
}
