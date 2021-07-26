import { PluginDocument } from 'types'

export function postSave(doc: PluginDocument): void {

	const options = doc.esOptions()

	const filter = options && options.filter

	function onIndex (err: any, res: any) {
		if (!filter || !filter(doc)) {
			doc.emit('es-indexed', err, res)
		} else {
			doc.emit('es-filtered', err, res)
		}
	}

	const populate = options && options.populate
	if (doc) {
		if (populate && populate.length) {
			populate.forEach(populateOpts => {
				doc.populate(populateOpts)
			})
			doc.execPopulate().then(popDoc => {
				popDoc.index(onIndex)
			})
		} else {
			doc.index(onIndex)
		}
	}
}

export function postRemove(doc: PluginDocument): void {
	doc.unIndex()
}