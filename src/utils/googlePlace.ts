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
