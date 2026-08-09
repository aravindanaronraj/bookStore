import mongoose, { Document, Schema } from "mongoose";

export interface IAddress {
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone: string;

  role: "user" | "admin";



  addresses: IAddress[];

  subscription: {
    plan: "free" | "premium";
    startDate?: Date;
    endDate?: Date;
  };

  isEmailVerified: boolean;

emailVerificationTokenHash?: string;
emailVerificationTokenExpires?: Date;

emailVerificationOtpHash?: string;
emailVerificationOtpExpires?: Date;

emailVerificationOtpAttempts: number;

emailVerificationLastSentAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    addressLine: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    pincode: {
      type: String,
      required: true,
      trim: true,
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: true,
  }
);

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    addresses: {
      type: [addressSchema],
      default: [],
    },

    subscription: {
      plan: {
        type: String,
        enum: ["free", "premium"],
        default: "free",
      },

      startDate: {
        type: Date,
      },

      endDate: {
        type: Date,
      },
    },

    emailVerificationTokenHash: {
  type: String,
},

emailVerificationTokenExpires: {
  type: Date,
},

emailVerificationOtpHash: {
  type: String,
},

emailVerificationOtpExpires: {
  type: Date,
},

emailVerificationOtpAttempts: {
  type: Number,
  default: 0,
},

emailVerificationLastSentAt: {
  type: Date,
},
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model<IUser>("User", userSchema);

export default User;