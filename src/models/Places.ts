import mongoose, { Schema, Document } from 'mongoose'

export interface IPlace extends Document {
  placeId: string
  name: string
  imageURL: string
  address: string
  location: {
    type: 'Point'
    coordinates: [number, number]
  }
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
      required: [true, 'Provide name between 3 to 200 char length'],
      minLength: [3, 'Name min length is 3'],
      maxLength: [200, 'Name max length is 200'],
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
  },
  {
    timestamps: true,
  }
)

PlaceSchema.index({ location: '2dsphere' })

export default mongoose.model<IPlace>('Place', PlaceSchema)
