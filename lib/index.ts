import { Document, Schema, HookNextFunction } from 'mongoose'
import { postSave, postRemove } from './hooks'
import { getIndexName, index, unIndex } from './methods'

export default function mongoosastic(schema: Schema, options: Options): void {

	schema.method('getIndexName', getIndexName)
	schema.method('index', index)
	schema.method('unIndex', unIndex)

	schema.post('save', (doc: Document, next: HookNextFunction) => {
		postSave(doc, options)
		next()
	})

	schema.post('findOneAndUpdate', (doc: Document, next: HookNextFunction) => {
		postSave(doc, options)
		next()
	})

	schema.post('findByIdAndUpdate', (doc: Document, next: HookNextFunction) => {
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