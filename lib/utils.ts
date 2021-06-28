import { Document, LeanDocument } from 'mongoose'
import { ApiError } from '@elastic/elasticsearch'
import client from './esClient'

export function serialize(doc: Document): LeanDocument<Document> {
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