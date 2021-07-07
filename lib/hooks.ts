import { PluginDocument } from 'types'
import { options } from './index'

export function postSave(doc: PluginDocument): void {

	const populate = options && options.populate
	if (doc) {
		if (populate && populate.length) {
			populate.forEach(populateOpts => {
				doc.populate(populateOpts)
			})
			doc.execPopulate().then(popDoc => {
				popDoc.index()
			})
		} else {
			doc.index()
		}
	}
}

export function postRemove(doc: PluginDocument): void {
	doc.unIndex()
}