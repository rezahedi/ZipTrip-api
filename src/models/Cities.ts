import mongoose, { Schema, Document } from 'mongoose'

export interface ICity extends Document {
  name: string
  description?: string
  imageURL: string
  createdAt?: Date
  updatedAt?: Date
}

const CitySchema: Schema<ICity> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Provide city name'],
    },
    description: {
      type: String,
      maxLength: 255,
    },
    imageURL: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
)

export default mongoose.model<ICity>('City', CitySchema)
