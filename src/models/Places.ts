import mongoose, { Schema, Document } from 'mongoose'

export interface IPlace extends Document {
  placeId: string
  name: string
  state?: string
  country: string
  imageURL: string
  address: string // shortFormattedAddress || formattedAddress
  location: {
    type: 'Point'
    coordinates: [number, number]
  }
  iconURL: string // iconMaskBaseUri : type
  iconBackground: string // iconBackgroundColor : category
  summary: string // editorialSummary.text || generativeSummary.overview.text
  reviewSummary: string // reviewSummary.text.text
  rating: number // rating
  userRatingCount: number // userRatingCount
  createdAt?: Date
  updatedAt?: Date
}

const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true,
  },
  coordinates: {
    type: [Number],
    required: true,
  },
})

const PlaceSchema: Schema<IPlace> = new Schema(
  {
    placeId: {
      type: String,
      unique: true,
      index: true,
      required: [true, 'Provide place ID'],
    },
    name: {
      type: String,
      required: [true, 'Provide place name'],
    },
    state: {
      type: String,
    },
    country: {
      type: String,
      required: [true, 'Provide country'],
    },
    imageURL: {
      type: String,
      default: '',
      required: [true, 'Provide image URL'],
    },
    address: {
      type: String,
      default: '',
      required: [true, 'Provide address'],
    },
    location: {
      _id: false,
      type: pointSchema,
      required: true,
    },
    iconBackground: {
      type: String,
      default: '',
      required: [true, 'Provide icon background Color'],
    },
    iconURL: {
      type: String,
      default: '',
      required: [true, 'Provide icon URL'],
    },
    summary: {
      type: String,
      default: '',
      required: [true, 'Provide editorial summary'],
    },
    reviewSummary: {
      type: String,
      default: '',
      required: [true, 'Provide review summary'],
    },
    rating: {
      type: Number,
      default: 0,
    },
    userRatingCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

PlaceSchema.index({ location: '2dsphere' })

export default mongoose.model<IPlace>('Place', PlaceSchema)
