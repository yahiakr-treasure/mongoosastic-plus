import { Document } from 'mongoose'
import { getIndexName, serialize } from './utils'
import client from './esClient'
import { ApiError } from '@elastic/elasticsearch'

export function index(doc: Document, options: Options, cb?: CallableFunction): void {
	
	const index = options && options.index
	const indexName = getIndexName(doc, index)

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
	const indexName = getIndexName(doc, index)
	
	const opt = {
		index: indexName,
		tries: 3,
		id: doc._id.toString(),
	}
	
	deleteById(opt, cb)
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