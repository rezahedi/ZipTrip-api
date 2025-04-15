import mongoose from 'mongoose'

const PlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
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
      maxLength: [255, 'Description max length is 255'],
      required: [true, 'Provide description'],
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
      type: [Number, Number],
    },
    finishLocation: {
      type: [Number, Number],
    },
    distance: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      default: 0,
    },
    categoryId: {
      type: mongoose.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Provide category'],
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('Plan', PlanSchema)
