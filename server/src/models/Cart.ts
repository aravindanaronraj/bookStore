import mongoose, { Schema, Document } from 'mongoose';

interface ICartItem {
book:mongoose.Types.ObjectId;
quantity:number;
}

export interface ICart extends Document {
    user: mongoose.Types.ObjectId;
    cartItems: ICartItem[];
    createdAt: Date;
    updatedAt: Date;
}

const ICartSchema: Schema = new Schema(
    {
        book:{
            type:Schema.Types.ObjectId,
            ref:'Book',
            required:true,
        },
        quantity:{
            type:Number,
            required:true,
            min:1,
        },
    },
    {
        _id:false,
    }
);

const CartSchema: Schema = new Schema(
    {
        user:{
            type:Schema.Types.ObjectId,
            ref:'User',
            unique:true,
            required:true,
        },
        cartItems:[ICartSchema],
        default:[],
    },
    {
        timestamps:true,
    }
);

const Cart = mongoose.model<ICart>('Cart', CartSchema);
export default Cart;