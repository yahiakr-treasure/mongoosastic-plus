import { Document, Schema, HookNextFunction } from 'mongoose'
import { postSave } from './hooks'

export default function mongoosastic(schema: Schema, options: Options): void {

	schema.post('save', (doc: Document, next: HookNextFunction) => {
		postSave(doc, options)
		next()
	})
}