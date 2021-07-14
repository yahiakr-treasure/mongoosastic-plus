import { LeanDocument, Model } from 'mongoose'
import { EsSearchOptions, PluginDocument } from 'types'
import { ApiError, ApiResponse } from '@elastic/elasticsearch'
import { client } from './index'
import { options } from './index'

let bulkBuffer: any[] = []
let bulkTimeout: any

export function isString (subject: any): boolean {
	return typeof subject === 'string'
}
  
export function isStringArray (arr: any): boolean {
	return arr.filter && arr.length === (arr.filter((item: any) => typeof item === 'string')).length
}

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

export function reformatESTotalNumber(res: any): any {
	Object.assign(res.body.hits, {
		total: res.body.hits.total.value,
		extTotal: res.body.hits.total
	})
	return res
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
	}, (err: any, res: any) => {
		// if (err) bulkErrEm.emit('error', err, res)
		if (res.items && res.items.length) {
			for (let i = 0; i < res.items.length; i++) {
				const info = res.items[i]
				if (info && info.index && info.index.error) {
					// bulkErrEm.emit('error', null, info.index)
				}
			}
		}
		// cb()
	})
	bulkBuffer = []
}

export function hydrate (res: ApiResponse, model: Model<PluginDocument>, opts: EsSearchOptions, cb: CallableFunction): void {
	const results = res.body.hits
	const resultsMap: Record<string, any> = {}
	
	const ids = results.hits.map((result: any, idx: any) => {
		resultsMap[result._id] = idx
		return result._id
	})

	const query = model.find({
		_id: {
			$in: ids
		}
	})
	const hydrateOptions = opts.hydrateOptions? opts.hydrateOptions : options.hydrateOptions

	// Build Mongoose query based on hydrate options
	// Example: {lean: true, sort: '-name', select: 'address name'}
	query.setOptions(hydrateOptions!)
	// Object.keys(hydrateOptions).forEach(option => {
	// 	query[option](hydrateOptions[option])
	// })

	query.exec((err, docs) => {
		let hits
		const docsMap: Record<string, PluginDocument> = {}

		if (err) {
			return cb(err)
		}

		if (!docs || docs.length === 0) {
			results.hits = []
			res.body.hits = results
			return cb(null, res)
		}

		if (hydrateOptions!.sort) {
			// Hydrate sort has precedence over ES result order
			hits = docs
		} else {
			// Preserve ES result ordering
			docs.forEach(doc => {
				docsMap[doc._id] = doc
			})
			hits = results.hits.map((result: any) => docsMap[result._id])
		}

		if (opts.highlight || opts.hydrateWithESResults) {
			hits.forEach((doc: any) => {
				const idx = resultsMap[doc._id]
				if (opts.highlight) {
					doc._highlight = results.hits[idx].highlight
				}
				if (opts.hydrateWithESResults) {
					// Add to doc ES raw result (with, e.g., _score value)
					doc._esResult = results.hits[idx]
					if (!opts.hydrateWithESResults.source) {
						// Remove heavy load
						delete doc._esResult._source
					}
				}
			})
		}

		results.hits = hits
		res.body.hits = results
		cb(null, res)
	})
}