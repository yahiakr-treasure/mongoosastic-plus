import { Document, Schema, HookNextFunction, SchemaType } from 'mongoose'

export default function mongoosastic(schema: Schema, options: any): void {

	schema.post(['find', 'findOne'], (docs: Document[], next: HookNextFunction) => {
		
		schema.eachPath((path: string, type: any ) => {
			console.log(`Path: ${path}, type: ${type.instance}, embedded: ${type.$embeddedSchemaType ?
				type.$embeddedSchemaType.instance: false}`)
		})
		
		console.log('Found those documents:', docs)
		next()
	})
}