import { Client } from '@elastic/elasticsearch'
import { BulkIndexOptions, BulkInstruction, BulkOptions, BulkUnIndexOptions } from 'types'

let bulkBuffer: BulkInstruction[] = []
let bulkTimeout: NodeJS.Timeout | undefined

function clearBulkTimeout() {
	clearTimeout(bulkTimeout as NodeJS.Timeout)
	bulkTimeout = undefined
}

export function bulkAdd(opts: BulkIndexOptions): void {
	const instruction = [{
		index: {
			_index: opts.index,
			_id: opts.id,
		}
	}, opts.body]
	
	bulkIndex(instruction, opts.bulk as BulkOptions, opts.client)
}

export function bulkDelete(opts: BulkUnIndexOptions): void {
	const instruction = [{
		delete: {
			_index: opts.index,
			_id: opts.id,
		}
	}]
	
	bulkIndex(instruction, opts.bulk as BulkOptions, opts.client)
}

export function bulkIndex(instruction: BulkInstruction[], bulk: BulkOptions, client: Client): void {

	bulkBuffer = bulkBuffer.concat(instruction)

	if (bulkBuffer.length >= bulk.size) {
		flush(client)
		clearBulkTimeout()
	} else if (bulkTimeout === undefined) {
		bulkTimeout = setTimeout(() => {
			flush(client)
			clearBulkTimeout()
		}, bulk.delay)
	}
}

function flush(client: Client): void {
	client.bulk({
		body: bulkBuffer
	}, (err, res) => {
		if (err) {
			// bulkErrEm.emit('error', err, res)
		}
		if (res.body.items && res.body.items.length) {
			for (let i = 0; i < res.body.items.length; i++) {
				const info = res.body.items[i]
				if (info && info.index && info.index.error) {
					// bulkErrEm.emit('error', null, info.index)
				}
			}
		}
		// cb()
	})
	bulkBuffer = []
}