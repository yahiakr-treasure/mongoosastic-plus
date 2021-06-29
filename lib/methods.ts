import { Document } from 'mongoose'
import { deleteById, serialize } from './utils'
import client from './esClient'

export function getIndexName(this: Document, indexName: string): string {
	if (!indexName) return this.collection.name
	else return indexName
}

export function index(this: Document, options: Options, cb?: CallableFunction): void {
	
	const index = options && options.index
	const indexName = (this as any).getIndexName(index)

	const body = serialize(this)
	
	const opt = {
		index: indexName,
		id: this._id.toString(),
		body: body
	}

	client.index(opt).then((value) => { if(cb) cb(value) })
}

export function unIndex(this: Document, options: Options, cb?: CallableFunction): void {

	if (!this) {
		return
	}
	
	const index = options && options.index
	const indexName = (this as any).getIndexName(index)
	
	const opt = {
		index: indexName,
		tries: 3,
		id: this._id.toString(),
	}
	
	deleteById(opt, cb)
}