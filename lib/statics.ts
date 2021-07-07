import events from 'events'
import { FilterQuery, Model } from 'mongoose'
import { PluginDocument } from 'types'
import { postSave } from './hooks'
import { options } from './index'

export function synchronize(this: Model<PluginDocument>, query: FilterQuery<PluginDocument>): events {
	const em = new events.EventEmitter()
	let closeValues: any[] = []
	let counter = 0

	// Set indexing to be bulk when synchronizing to make synchronizing faster
	// Set default values when not present
	const bulk = {
		delay: (options && options.bulk && options.bulk.delay) || 1000,
		size: (options && options.bulk && options.bulk.size) || 1000,
		batch: (options && options.bulk && options.bulk.batch) || 50
	}

	const stream = this.find(query).batchSize(bulk.batch).cursor()

	stream.on('data', doc => {
		stream.pause()
		counter++

		function onIndex (indexErr: any, inDoc: PluginDocument) {
			counter--
			if (indexErr) {
				em.emit('error', indexErr)
			} else {
				em.emit('data', null, inDoc)
			}
			stream.resume()
		}

		doc.on('es-indexed', onIndex)
		doc.on('es-filtered', onIndex)

		postSave(doc)
	})

	stream.on('close', (pA: any, pB: any) => {
		closeValues = [pA, pB]
		const closeInterval = setInterval(() => {
			if (counter === 0) {
				clearInterval(closeInterval)
				em.emit('close', ...closeValues)
			}
		}, 1000)
	})

	stream.on('error', err => {
		em.emit('error', err)
	})

	return em
}