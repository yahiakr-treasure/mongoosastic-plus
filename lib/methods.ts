import { PluginDocument } from 'types'
import { deleteById, getIndexName, serialize } from './utils'
import { client } from './index'
import { bulkAdd, bulkDelete } from './bulking'
import Generator from './mapping'

export function index(this: PluginDocument, inOpts: any = {}, cb?: CallableFunction): void {

	if (arguments.length < 2) {
		cb = inOpts
		inOpts = {}
	}

	const options = this.esOptions()

	const filter = options && options.filter

	// unindex filtered models
	if (filter && filter(this)) {
		return this.unIndex(cb)
	}

	const indexName = inOpts.index ? inOpts.index : getIndexName(this)

	const generator = new Generator()
	const mapping = generator.generateMapping(this.schema)

	let body: any
	if (options.customSerialize) {
		body = options.customSerialize(this, mapping)
	} else {
		body = serialize(this, mapping)
	}

	if (options.transform) body = options.transform(body, this)

	const opt = {
		index: indexName,
		id: this._id.toString(),
		body: body,
		bulk: options.bulk,
		routing: options.routing ? options.routing(this) : undefined
	}

	if (opt.bulk) {
		bulkAdd(opt)
		setImmediate(() => { if (cb) cb(null, this) })

	} else {
		client.index(opt).then((value) => { if (cb) cb(value) })
	}
}

export function unIndex(this: PluginDocument, cb?: CallableFunction): void {

	const options = this.esOptions()

	const indexName = getIndexName(this)

	const opt = {
		index: indexName,
		tries: 3,
		id: this._id.toString(),
		bulk: options.bulk,
		model: this,
		routing: options.routing ? options.routing(this) : undefined
	}

	if (opt.bulk) {
		bulkDelete(opt, cb)
	} else {
		deleteById(opt, cb)
	}
}