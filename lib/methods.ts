import { PluginDocument } from 'types'
import { deleteById, getIndexName, serialize } from './utils'
import { client } from './index'
import { bulkAdd, bulkDelete } from './bulking'

export function index(this: PluginDocument, cb?: CallableFunction): void {

	const options = this.esOptions()
	
	const indexName = getIndexName(this)

	const body = serialize(this)
	
	const opt = {
		index: indexName,
		id: this._id.toString(),
		body: body,
		bulk: options.bulk
	}
		
	if (options.bulk) {
		bulkAdd(opt)
		setImmediate(() => { if(cb) cb(null, this) })

	} else {
		client.index(opt).then((value) => { if(cb) cb(value) })
	}
}

export function unIndex(this: PluginDocument, cb?: CallableFunction): void {

	if (!this) {
		return
	}

	const options = this.esOptions()
	
	const indexName = getIndexName(this)
	
	const opt = {
		index: indexName,
		tries: 3,
		id: this._id.toString(),
		bulk: options.bulk
	}

	if (options.bulk) {
		bulkDelete(opt, cb)
	} else {
		deleteById(opt, cb)
	}
}