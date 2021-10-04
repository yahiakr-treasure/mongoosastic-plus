import { client } from './index'

let bulkBuffer: any[] = []
let bulkTimeout: any

function clearBulkTimeout() {
	clearTimeout(bulkTimeout)
	bulkTimeout = undefined
}

export function bulkAdd(opts: any): void {
	const instruction = [{
		index: {
			_index: opts.index,
			_id: opts.id,
		}
	}, opts.body]
	
	bulkIndex(instruction, opts.bulk)
}

export function bulkDelete(opts: any, cb?: CallableFunction): void {
	const instruction = [{
		delete: {
			_index: opts.index,
			_id: opts.id,
		}
	}]
	
	bulkIndex(instruction, opts.bulk)
	if(cb) cb()
}

export function bulkIndex(instruction: any[], bulk: any): void {

	bulkBuffer = bulkBuffer.concat(instruction)

	if (bulkBuffer.length >= bulk.size) {
		flush()
		clearBulkTimeout()
	} else if (bulkTimeout === undefined) {
		bulkTimeout = setTimeout(() => {
			flush()
			clearBulkTimeout()
		}, bulk.delay)
	}
}

function flush(): void {
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