import { Schema } from 'mongoose'
import { Options, PluginDocument } from 'types'
import { postSave, postRemove } from './hooks'
import { index, unIndex } from './methods'
import { esSearch, search } from './search'
import { esTruncate, synchronize } from './statics'

let globalOptions: Options

function mongoosastic(schema: Schema<PluginDocument>, options: Options = {}): void {

	globalOptions = options

	schema.method('index', index)
	schema.method('unIndex', unIndex)

	schema.static('synchronize', synchronize)
	schema.static('esTruncate', esTruncate)

	schema.static('search', search)
	schema.static('esSearch', esSearch)

	schema.post('save', postSave)
	schema.post('insertMany', (docs: PluginDocument[]) => docs.forEach((doc) => postSave(doc)))

	schema.post('findOneAndUpdate', postSave)
	schema.post('findByIdAndUpdate', postSave)

	schema.post(['findOneAndDelete', 'findOneAndRemove'], postRemove)
}

export { globalOptions as options }
export default mongoosastic