import { Document } from 'mongoose'
import { deleteById, serialize } from './utils'
import client from './esClient'
import { options } from './index'

export function getIndexName(this: Document): string {
	const indexName = options && options.index
	if (!indexName) return this.collection.name
	else return indexName
}

export function index(this: Document, cb?: CallableFunction): void {
	
	const indexName = (this as any).getIndexName()

	const body = serialize(this)
	
	const opt = {
		index: indexName,
		id: this._id.toString(),
		body: body
	}

	client.index(opt).then((value) => { if(cb) cb(value) })
}

export function unIndex(this: Document, cb?: CallableFunction): void {

	if (!this) {
		return
	}
	
	const indexName = (this as any).getIndexName()
	
	const opt = {
		index: indexName,
		tries: 3,
		id: this._id.toString(),
	}
	
	deleteById(opt, cb)
}