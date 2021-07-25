import { Client } from '@elastic/elasticsearch'
import { Schema } from 'mongoose'
import { Options, PluginDocument } from 'types'
import { createEsClient } from './esClient'
import { postSave, postRemove } from './hooks'
import { index, unIndex } from './methods'
import { esSearch, search } from './search'
import { createMapping, esCount, esTruncate, refresh, synchronize } from './statics'

let globalOptions: Options
let client: Client

function mongoosastic(schema: Schema<PluginDocument>, options: Options = {}): void {

	globalOptions = options

	client = createEsClient(options)

	schema.method('index', index)
	schema.method('unIndex', unIndex)

	schema.static('synchronize', synchronize)
	schema.static('esTruncate', esTruncate)

	schema.static('search', search)
	schema.static('esSearch', esSearch)

	schema.static('createMapping', createMapping)
	schema.static('refresh', refresh)
	schema.static('esCount', esCount)

	schema.post('save', postSave)
	schema.post('insertMany', (docs: PluginDocument[]) => docs.forEach((doc) => postSave(doc)))

	schema.post('findOneAndUpdate', postSave)

	schema.post('remove', postRemove)
	schema.post(['findOneAndDelete', 'findOneAndRemove'], postRemove)
}

export {
	globalOptions as options,
	client
}

export default mongoosastic