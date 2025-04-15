import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
  name: string
  email: string
  password: string
  createdAt?: Date
  updatedAt?: Date
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxLength: [20, 'Name is too long'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        'Email is not valid',
      ],
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minLength: [6, 'Password is too short'],
    },
  },
  {
    timestamps: true,
  }
)

export default mongoose.model<IUser>('User', UserSchema)
