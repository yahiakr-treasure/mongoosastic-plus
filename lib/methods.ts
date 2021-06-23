import { Document } from 'mongoose'
import { getIndexName, serialize } from './utils'
import client from './esClient'

export function index(doc: Document, options: Options, cb?: CallableFunction): void {
	
	const index = options && options.index
	const indexName = getIndexName(doc, index)

	const body = serialize(doc)
	
	const opt = {
		index: indexName,
		id: doc._id.toString(),
		body: body
	}

	client.index(opt).then((value) => {
		cb!(value)
	})
}