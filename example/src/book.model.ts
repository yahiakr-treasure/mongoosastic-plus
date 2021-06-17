import mongoose, { Schema, Document } from 'mongoose'

export interface IBook extends Document{
    title: string;
    description: string;
    price: number;
}

const BookSchema: Schema = new Schema({
	title: { type: String, required: true },
	description: { type: String },
	price: { type: Number, required: true },
})

// Export the model and return your IBook interface
export const Books = mongoose.model<IBook>('Book', BookSchema)