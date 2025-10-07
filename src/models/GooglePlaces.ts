import mongoose, { Schema, Document } from 'mongoose'

export interface IGooglePlace extends Document {
  googlePlaceId: string
  version: number
  data: string
  createdAt?: Date
  updatedAt?: Date
}

const GooglePlaceSchema: Schema<IGooglePlace> = new Schema(
  {
    googlePlaceId: {
      type: String,
      required: [true, 'Provide google place id'],
      unique: true,
    },
    version: {
      type: Number,
      required: [true, 'Provide version'],
    },
    data: {
      type: String,
      required: [true, 'Provide data'],
    },
  },
  {
    timestamps: true,
  }
)

export default mongoose.model<IGooglePlace>('GooglePlace', GooglePlaceSchema)
