import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IList extends Document {
  userId: Types.ObjectId
  name: string
  places: string[]
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
    places: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
)

export default mongoose.model<IList>('List', ListSchema)
