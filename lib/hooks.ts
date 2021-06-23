import { Document } from 'mongoose'
import { index } from './methods'

export function postSave(doc: Document, options: Options): void {

	const populate = options.populate
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