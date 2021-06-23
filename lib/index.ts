import { Document, Schema, HookNextFunction } from 'mongoose'
import Generator from './mapping-generator'

export default function mongoosastic(schema: Schema, options: Options): void {

	const generator = new Generator()

	schema.post(['find', 'findOne'], (docs: Document[], next: HookNextFunction) => {

		const mapping = generator.generateMapping(schema)

		console.log('mapping:', mapping)
		
		console.log('Found those documents:', docs)
		next()
	})
}