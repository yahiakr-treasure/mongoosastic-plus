import { Document } from 'mongoose'

export function postSave(doc: Document, options: Options): void {

	const populate = options && options.populate
	if (doc) {
		if (populate && populate.length) {
			populate.forEach(populateOpts => {
				doc.populate(populateOpts)
			})
			doc.execPopulate().then(popDoc => {
				(popDoc as any).index(options)
			})
		} else {
			(doc as any).index(options)
		}
	}
}

export function postRemove(doc: Document, options: Options): void {
	(doc as any).unIndex(options)
}