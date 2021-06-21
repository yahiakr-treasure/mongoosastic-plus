import { Document, Schema, HookNextFunction } from 'mongoose'

export default function mongoosastic(schema: Schema, options: any): void {

	schema.post(['find', 'findOne'], (docs: Document[], next: HookNextFunction) => {
		console.log('Found those documents:', docs)
		next()
	})
}