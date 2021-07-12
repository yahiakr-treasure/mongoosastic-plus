import { PluginDocument } from 'types'
import { bulkIndex, deleteById, getIndexName, serialize } from './utils'
import client from './esClient'
import { options } from './index'

export function index(this: PluginDocument, cb?: CallableFunction): void {
	
	const indexName = getIndexName(this)

	const body = serialize(this)
	
	const opt = {
		index: indexName,
		id: this._id.toString(),
		body: body
	}
		
	if (options.bulk) {

		const instruction = [{
			index: {
				_index: opt.index,
				_id: opt.id,
			}
		}, opt.body]
		
		bulkIndex(instruction)
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