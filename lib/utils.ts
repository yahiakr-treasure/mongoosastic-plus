import { LeanDocument } from 'mongoose'
import { PluginDocument } from 'types'
import { ApiError } from '@elastic/elasticsearch'
import client from './esClient'
import { options } from './index'

let bulkBuffer: any[] = []
let bulkTimeout: any

export function getIndexName(doc: PluginDocument): string {
	const indexName = options && options.index
	if (!indexName) return doc.collection.name
	else return indexName
}

export function serialize(doc: PluginDocument): LeanDocument<PluginDocument> {
	const body = doc.toObject()
	delete body['_id']

	return body
}

export function deleteById(opt: Record<string, any>, cb?: CallableFunction): void {
	
	client.delete({
		index: opt.index,
		id: opt.id,
	}, (err: ApiError) => {
		if (err) {
			if (opt.tries <= 0) {
				if(cb) return cb(err)
			}
			opt.tries = --opt.tries
			setTimeout(() => {
				deleteById(opt, cb)
			}, 500)
		} else {
			if(cb) cb(err)
		}
	})
}

export function bulkAdd(opts: any): void {
	const instruction = [{
		index: {
			_index: opts.index,
			_id: opts.id,
		}
	}, opts.body]
	
	bulkIndex(instruction)
}

export function bulkDelete(opts: any, cb?: CallableFunction): void {
	const instruction = [{
		delete: {
			_index: opts.index,
			_id: opts.id,
		}
	}]
	
	bulkIndex(instruction)
	if(cb) cb()
}

export function bulkIndex(instruction: any[]): void {

	bulkBuffer = bulkBuffer.concat(instruction)

	if (bulkBuffer.length >= options.bulk!.size) {
		flush()
		clearBulkTimeout()
	} else if (bulkTimeout === undefined) {
		bulkTimeout = setTimeout(() => {
			flush()
			clearBulkTimeout()
		}, options.bulk!.delay)
	}
}

function clearBulkTimeout() {
	clearTimeout(bulkTimeout)
	bulkTimeout = undefined
}

function flush(): void {
	client.bulk({
		body: bulkBuffer
	}, (err, res) => {
		if (err) console.log('There\'s an error in flush function')
		else console.log('flush done!')
		
		// if (err) bulkErrEm.emit('error', err, res)
		// if (res.items && res.items.length) {
		// 	for (let i = 0; i < res.items.length; i++) {
		// 		const info = res.items[i]
		// 		if (info && info.index && info.index.error) {
		// 			bulkErrEm.emit('error', null, info.index)
		// 		}
		// 	}
		// }
		// cb()
	})
	bulkBuffer = []
}