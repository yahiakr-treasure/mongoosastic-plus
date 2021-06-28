import { Document } from 'mongoose'
import { index, unIndex } from './methods'

export function postSave(doc: Document, options: Options): void {

	const populate = options && options.populate
	if (doc) {
		if (populate && populate.length) {
			populate.forEach(populateOpts => {
				doc.populate(populateOpts)
			})
			doc.execPopulate().then(popDoc => {
				index(popDoc, options)
			})
		} else {
			index(doc, options)
		}
	}
}

export function postRemove(doc: Document, options: Options): void {
	unIndex(doc, options)
}