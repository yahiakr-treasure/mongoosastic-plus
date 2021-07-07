import { Document } from 'mongoose'
import { options } from './index'

export function postSave(doc: Document): void {

	const populate = options && options.populate
	if (doc) {
		if (populate && populate.length) {
			populate.forEach(populateOpts => {
				doc.populate(populateOpts)
			})
			doc.execPopulate().then(popDoc => {
				(popDoc as any).index()
			})
		} else {
			(doc as any).index()
		}
	}
}

export function postRemove(doc: Document): void {
	(doc as any).unIndex()
}