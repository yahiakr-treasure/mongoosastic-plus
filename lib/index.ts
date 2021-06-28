import { Document, Schema, HookNextFunction } from 'mongoose'
import { postSave, postRemove } from './hooks'

export default function mongoosastic(schema: Schema, options: Options): void {

	schema.post('save', (doc: Document, next: HookNextFunction) => {
		postSave(doc, options)
		next()
	})

	schema.post('findOneAndUpdate', (doc: Document, next: HookNextFunction) => {
		postSave(doc, options)
		next()
	})

	schema.post('insertMany', (docs: Document[], next: HookNextFunction) => {
		docs.forEach((doc) => postSave(doc, options))
		next()
	})

	schema.post(['findOneAndDelete', 'findOneAndRemove'], (doc: Document, next: HookNextFunction) => {
		postRemove(doc, options)
		next()
	})
}