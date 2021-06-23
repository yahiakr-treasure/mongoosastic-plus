import mongoose, { Schema, Document } from 'mongoose'
import mongoosastic from '../../lib'

export interface IBook extends Document{
    title: string;
    description: string;
    price: number;
}

const BookSchema: Schema = new Schema({
	title: { 
		fr: { type: String, required: true },
		ar: { type: String },
		en: { type: String },
	},
	description: String,
	keywords: [String],
	price: { type: Number, required: true },
})

BookSchema.plugin(mongoosastic)

// Export the model and return your IBook interface
export const Books = mongoose.model<IBook>('Book', BookSchema)