import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IStop extends Document {
  userId: Types.ObjectId
  planId: Types.ObjectId
  name: string
  description?: string
  imageURL: string
  address: string
  location: {
    type: 'Point'
    coordinates: [number, number]
  }
  sequence: number
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

const StopSchema: Schema<IStop> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Provide user'],
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: [true, 'Provide plan'],
    },
    name: {
      type: String,
      required: [true, 'Provide name between 3 to 200 char length'],
      minLength: [3, 'Name min length is 3'],
      maxLength: [200, 'Name max length is 200'],
    },
    description: {
      type: String,
      maxLength: 255,
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
      type: pointSchema,
      required: true,
    },
    sequence: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

StopSchema.index({ location: '2dsphere' })

export default mongoose.model<IStop>('Stop', StopSchema)
