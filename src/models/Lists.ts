import mongoose, { Schema, Document, Types } from 'mongoose'
import { IPlanStop, stopSchema } from './Plans'

export interface IList extends Document {
  userId: Types.ObjectId
  name: string
  placeIDs: string[]
  placeDetails: IPlanStop[]
  createdAt?: Date
  updatedAt?: Date
}

const ListSchema: Schema<IList> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Provide user'],
    },
    name: {
      type: String,
      required: [true, 'Provide list name'],
    },
    placeIDs: {
      type: [String],
      default: [],
    },
    placeDetails: [
      {
        _id: false,
        type: stopSchema,
      },
    ],
  },
  {
    timestamps: true,
  }
)

export default mongoose.model<IList>('List', ListSchema)
