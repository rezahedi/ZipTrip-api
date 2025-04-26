import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IBookmark extends Document {
  userId: Types.ObjectId
  planId: Types.ObjectId
  createdAt?: Date
  updatedAt?: Date
}

const BookmarkSchema: Schema<IBookmark> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Provide user ID'],
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: [true, 'Provide plan ID'],
    },
  },
  {
    timestamps: true,
  }
)

BookmarkSchema.index({ userId: 1, planId: 1 }, { unique: true })

export default mongoose.model<IBookmark>('Bookmark', BookmarkSchema)
