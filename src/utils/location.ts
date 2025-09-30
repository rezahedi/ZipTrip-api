type coordinateType = Array<number>
type geoJsonType = {
  type: string
  coordinates: coordinateType
}

export const geoJsonToCoords = (geojsonObj: geoJsonType | undefined) => {
  if (!geojsonObj) return []
  return [geojsonObj.coordinates[1], geojsonObj.coordinates[0]]
}

export const coordsToGeoJson = (coords: coordinateType) => {
  if (coords.length < 2) coords = [0, 0]
  return {
    type: 'Point',
    coordinates: [coords[1], coords[0]],
  }
}
