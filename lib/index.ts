import { Client } from '@elastic/elasticsearch'
import { Schema } from 'mongoose'
import { Options, PluginDocument } from 'types'
import { createEsClient } from './esClient'
import { postSave, postRemove } from './hooks'
import { index, unIndex } from './methods'
import { esSearch, search } from './search'
import { createMapping, esCount, esTruncate, refresh, synchronize } from './statics'

let client: Client

const defaultOptions = {
	indexAutomatically: true
}

function mongoosastic(schema: Schema<PluginDocument>, options: Options = {}): void {

	options = { ...defaultOptions, ...options }

	schema.method('esOptions', () => { return options })
	schema.static('esOptions', () => { return options })

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

	if(options.indexAutomatically) {
		schema.post('save', postSave)
		schema.post('insertMany', (docs: PluginDocument[]) => docs.forEach((doc) => postSave(doc)))

		schema.post('findOneAndUpdate', postSave)

		schema.post('remove', postRemove)
		schema.post(['findOneAndDelete', 'findOneAndRemove'], postRemove)
	}
}

export {
	client
}

export default mongoosastic