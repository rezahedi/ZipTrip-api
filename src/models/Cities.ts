import mongoose, { Schema, Document } from 'mongoose'

export interface ICity extends Document {
  placeId: string
  name: string
  imageURL: string
  location: {
    type: 'Point'
    coordinates: [number, number]
  }
  plans: number
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

const CitySchema: Schema<ICity> = new Schema(
  {
    placeId: {
      type: String,
      unique: true,
      index: true,
      required: [true, 'Provide place ID'],
    },
    name: {
      type: String,
      required: [true, 'Provide city name'],
    },
    imageURL: {
      type: String,
      default: '',
      required: [true, 'Provide image URL'],
    },
    location: {
      _id: false,
      type: pointSchema,
      required: true,
    },
    plans: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

CitySchema.index({ location: '2dsphere' })

export default mongoose.model<ICity>('City', CitySchema)
