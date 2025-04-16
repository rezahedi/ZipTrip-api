import mongoose, { Schema, Document, Types } from 'mongoose'
import './Categories'
import './Users'

export interface IPlan extends Document {
  userId: Types.ObjectId
  title: string
  description?: string
  images: string[]
  type?: 'Full day' | 'Half day' | 'Night'
  stopCount: number
  rate: number
  reviewCount: number
  startLocation: [number, number]
  finishLocation: [number, number]
  distance: number
  duration: number
  categoryId: Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
}

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
      maxLength: 255,
    },
    images: {
      type: [String],
      default: [],
    },
    type: {
      type: String,
      enum: ['Full day', 'Half day', 'Night'],
    },
    stopCount: {
      type: Number,
      default: 0,
    },
    rate: {
      type: Number,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    startLocation: {
      type: [Number],
      required: [true, 'Provide start location'],
    },
    finishLocation: {
      type: [Number],
      required: [true, 'Provide finish location'],
    },
    distance: {
      type: Number,
      default: 0,
      required: [true, 'Provide distance'],
    },
    duration: {
      type: Number,
      default: 0,
      required: [true, 'Provide duration'],
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Provide category'],
    },
  },
  {
    timestamps: true,
  }
)

export default mongoose.model<IPlan>('Plan', PlanSchema)
