import mongoose, { Document, Schema } from 'mongoose'
import bcrypt from 'bcryptjs'
import jwt, { SignOptions } from 'jsonwebtoken'

export interface IUser extends Document {
  name: string
  email: string
  password: string
  imageURL: string
  passwordResetToken?: string
  passwordResetExpires?: number
  createdAt?: Date
  updatedAt?: Date
  createJWT(): string
  comparePassword(userPassword: string): Promise<boolean>
}

const UserSchema: Schema<IUser> = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Please provide name.'],
      minLength: 1,
      maxLength: 50,
    },
    email: {
      type: String,
      required: [true, 'Please provide email address.'],
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        'Please provide a valid email',
      ],
      lowercase: true,
      unique: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide password with minimum 8 characters.'],
      minlength: 8,
      validate: {
        validator: function (value: string) {
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(value)
        },
        message: 'Password must include at least one uppercase letter, one lowercase letter, and one number',
      },
    },
    imageURL: {
      type: String,
      default: '',
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Number,
    },
  },
  { timestamps: true }
)

// Pre save hook for password hashing and trimming fields
UserSchema.pre<IUser>('save', async function (next) {
  this.name = this.name.trim()
  this.email = this.email.toLocaleLowerCase().trim()

  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
  }

  next()
})

// create JWT token method
UserSchema.methods.createJWT = function (): string {
  const secretKey = process.env.JWT_SECRET_KEY as string // Explicit cast to string
  if (!secretKey) {
    throw new Error('JWT_SECRET_KEY is not defined in the environment variable.')
  }
  // previous code with error
  // const expiresIn = process.env.JWT_LIFETIME ? parseInt(process.env.JWT_LIFETIME) : 3600 // Default to 1 hour (3600 seconds)
  // const options: SignOptions = {
  //   expiresIn,
  // }
  const expiresIn = process.env.JWT_LIFETIME || '1d'
  const options: SignOptions = {
    expiresIn: expiresIn as SignOptions['expiresIn'],
  }

  return jwt.sign({ userId: this._id, name: this.name }, secretKey, options)
}

// compare password method
UserSchema.methods.comparePassword = async function (userPassword: string): Promise<boolean> {
  return await bcrypt.compare(userPassword, this.password)
}

// define and export the User model
export default mongoose.model<IUser>('User', UserSchema)
