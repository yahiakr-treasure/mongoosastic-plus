import { PluginDocument } from 'types'
import { bulkIndex, deleteById, getIndexName, serialize } from './utils'
import client from './esClient'

export function index(this: PluginDocument, cb?: CallableFunction): void {
	
	const indexName = getIndexName(this)

	const body = serialize(this)
	
	const opt = {
		index: indexName,
		id: this._id.toString(),
		body: body
	}

	const bulk = true
	if (bulk) {
		bulkIndex(opt)
		setImmediate(() => { if(cb) cb(null, this) })
	} else {
		client.index(opt).then((value) => { if(cb) cb(value) })
	}
}

export function unIndex(this: PluginDocument, cb?: CallableFunction): void {

	if (!this) {
		return
	}
	
	const indexName = getIndexName(this)
	
	const opt = {
		index: indexName,
		tries: 3,
		id: this._id.toString(),
	}
	
	deleteById(opt, cb)
}