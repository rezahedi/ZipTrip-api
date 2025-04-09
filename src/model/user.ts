import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      trim: true,
      required: [true, 'Please provide your first name.'],
      minlength: 1,
      maxlength: 50,
    },
    lastName: {
      type: String,
      trim: true,
      required: [true, 'Please provide your last name.'],
      minlength: 1,
      maxlength: 50,
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
      required: [true, 'Please provide password.'],
      minlength: 8,
      validate: {
        validator: function (value: string) {
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(value)
        },
        message: 'Password must include at least one uppercase letter, one lowercase letter, and one number',
      },
    },
    confirmPassword: {
      type: String,
      validate: {
        validator: function (value: string) {
          return value === this.password
        },
        message: 'Password does not match.',
      },
    },
  },
  { timestamps: true }
)
