import { Document, Schema } from 'mongoose'
import { postSave, postRemove } from './hooks'
import { getIndexName, index, unIndex } from './methods'

let globalOptions: Options

function mongoosastic(schema: Schema, options: Options): void {

	globalOptions = options

	schema.method('getIndexName', getIndexName)
	schema.method('index', index)
	schema.method('unIndex', unIndex)

	schema.post('save', postSave)
	schema.post('insertMany', (docs: Document[]) => docs.forEach((doc) => postSave(doc)))

	schema.post('findOneAndUpdate', postSave)
	schema.post('findByIdAndUpdate', postSave)

	schema.post(['findOneAndDelete', 'findOneAndRemove'], postRemove)
}

export { globalOptions as options }
export default mongoosastic