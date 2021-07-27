import { LeanDocument, Model } from 'mongoose'
import { EsSearchOptions, PluginDocument } from 'types'
import { ApiError, ApiResponse } from '@elastic/elasticsearch'
import { client } from './index'


export function isString (subject: any): boolean {
	return typeof subject === 'string'
}
  
export function isStringArray (arr: any): boolean {
	return arr.filter && arr.length === (arr.filter((item: any) => typeof item === 'string')).length
}

export function getIndexName(doc: PluginDocument | Model<PluginDocument>): string {
	const options = (doc as any).esOptions()
	const indexName = options && options.index
	if (!indexName) return `${doc.collection.name}s`
	else return indexName
}

export function filterMappingFromMixed (props: any): any {
	const filteredMapping: Record<string, any> = {}
	Object.keys(props).map((key) => {
		const field = props[key]
		if (field.type !== 'mixed') {
			filteredMapping[key] = field
			if (field.properties) {
				filteredMapping[key].properties = filterMappingFromMixed(field.properties)
				if (!Object.keys(filteredMapping[key].properties).length) {
					delete filteredMapping[key].properties
				}
			}
		}
	})
	return filteredMapping
}

export function serialize(doc: PluginDocument): LeanDocument<PluginDocument> {
	const body = doc.toObject()
	delete body['_id']

	return body
}

export function deleteById(opt: Record<string, any>, cb?: CallableFunction): void {
	
	const model = opt.model
	
	client.delete({
		index: opt.index,
		id: opt.id,
	}, (err: ApiError, res: any) => {
		if (err) {
			if (opt.tries <= 0) {
				model.emit('es-removed', err, res)
				if(cb) return cb(err)
			}
			opt.tries = --opt.tries
			setTimeout(() => {
				deleteById(opt, cb)
			}, 500)
		} else {
			model.emit('es-removed', err, res)
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

export function hydrate (res: ApiResponse, model: Model<PluginDocument>, opts: EsSearchOptions, cb: CallableFunction): void {

	const options = (model as any).esOptions()

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