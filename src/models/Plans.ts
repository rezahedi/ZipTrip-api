import mongoose, { Schema, Document, Types } from 'mongoose'
import './Users'

export interface IPlanStop {
  placeId: string
  name: string
  description?: string
  imageURL: string
  address: string
  location: [number]
}

interface ICityRef {
  placeId: string
  name: string
}

export interface IPlan extends Document {
  userId: Types.ObjectId
  title: string
  description?: string
  images: string[]
  type?: 'Full day' | 'Half day' | 'Night'
  cities: ICityRef[]
  stopCount: number
  stops: IPlanStop[]
  rate: number
  reviewCount: number
  startLocation?: {
    type: 'Point'
    coordinates: [number, number]
  }
  finishLocation?: {
    type: 'Point'
    coordinates: [number, number]
  }
  distance: number
  duration: number
  createdAt?: Date
  updatedAt?: Date
}

const CitySchema = new mongoose.Schema<ICityRef>(
  {
    placeId: { type: String, required: true },
    name: { type: String, required: true },
  },
  { _id: false }
)

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

export const stopSchema = new mongoose.Schema({
  placeId: {
    type: String,
    required: [true, 'Provide place ID'],
    // ref: 'Place',
  },
  name: {
    type: String,
    required: [true, 'Provide place name'],
  },
  description: String,
  imageURL: String,
  address: String,
  location: {
    type: [Number, Number],
    required: [true, 'Provide location coordinates for each stop'],
  },
  rating: {
    type: Number,
    default: 0,
  },
  userRatingCount: {
    type: Number,
    default: 0,
  },
})

const PlanSchema: Schema<IPlan> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Provide user'],
    },
    title: {
      type: String,
      required: [true, 'Provide title between 3 to 200 char length'],
      minLength: [3, 'Title min length is 3'],
      maxLength: [200, 'Title max length is 200'],
    },
    description: {
      type: String,
    },
    images: {
      type: [String],
      default: [],
      required: [true, 'Provide at least one image url'],
    },
    type: {
      type: String,
      enum: ['Full day', 'Half day', 'Night'],
    },
    cities: { type: [CitySchema], required: true },
    stopCount: {
      type: Number,
      default: 0,
    },
    stops: [
      {
        _id: false,
        type: stopSchema,
      },
    ],
    rate: {
      type: Number,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    startLocation: {
      _id: false,
      type: pointSchema,
    },
    finishLocation: {
      _id: false,
      type: pointSchema,
    },
    distance: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

PlanSchema.index({ 'cities.placeId': 1 })
PlanSchema.index({ 'stops.placeId': 1 })
PlanSchema.index({ startLocation: '2dsphere' })
PlanSchema.index({ finishLocation: '2dsphere' })

export default mongoose.model<IPlan>('Plan', PlanSchema)
