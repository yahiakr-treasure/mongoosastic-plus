import { LeanDocument } from 'mongoose'
import { PluginDocument } from 'types'
import { ApiError } from '@elastic/elasticsearch'
import client from './esClient'
import { options } from './index'

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