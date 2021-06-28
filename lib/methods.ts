import { Document } from 'mongoose'
import { deleteById, serialize } from './utils'
import client from './esClient'

export function getIndexName(this: Document, indexName: string): string {
	if (!indexName) return this.collection.name
	else return indexName
}

export function index(doc: Document, options: Options, cb?: CallableFunction): void {
	
	const index = options && options.index
	const indexName = (doc as any).getIndexName(index)

	const body = serialize(doc)
	
	const opt = {
		index: indexName,
		id: doc._id.toString(),
		body: body
	}

	client.index(opt).then((value) => { if(cb) cb(value) })
}

export function unIndex(doc: Document, options: Options, cb?: CallableFunction): void {

	if (!doc) {
		return
	}
	
	const index = options && options.index
	const indexName = (doc as any).getIndexName(index)
	
	const opt = {
		index: indexName,
		tries: 3,
		id: doc._id.toString(),
	}
	
	deleteById(opt, cb)
}