import { Schema } from 'mongoose'
import { Options, PluginDocument } from 'types'
import { postSave, postRemove } from './hooks'
import { index, unIndex } from './methods'

let globalOptions: Options

function mongoosastic(schema: Schema<PluginDocument>, options: Options): void {

	globalOptions = options

	schema.method('index', index)
	schema.method('unIndex', unIndex)

	schema.post('save', postSave)
	schema.post('insertMany', (docs: PluginDocument[]) => docs.forEach((doc) => postSave(doc)))

	schema.post('findOneAndUpdate', postSave)
	schema.post('findByIdAndUpdate', postSave)

	schema.post(['findOneAndDelete', 'findOneAndRemove'], postRemove)
}

export { globalOptions as options }
export default mongoosastic