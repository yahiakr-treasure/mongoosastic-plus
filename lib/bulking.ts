import { client } from './index'
import { options } from './index'

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
	
	bulkIndex(instruction)
}

export function bulkDelete(opts: any, cb?: CallableFunction): void {
	const instruction = [{
		delete: {
			_index: opts.index,
			_id: opts.id,
		}
	}]
	
	bulkIndex(instruction)
	if(cb) cb()
}

export function bulkIndex(instruction: any[]): void {

	bulkBuffer = bulkBuffer.concat(instruction)

	if (bulkBuffer.length >= options.bulk!.size) {
		flush()
		clearBulkTimeout()
	} else if (bulkTimeout === undefined) {
		bulkTimeout = setTimeout(() => {
			flush()
			clearBulkTimeout()
		}, options.bulk!.delay)
	}
}

function flush(): void {
	client.bulk({
		body: bulkBuffer
	}, (err: any, res: any) => {
		// if (err) bulkErrEm.emit('error', err, res)
		if (res.items && res.items.length) {
			for (let i = 0; i < res.items.length; i++) {
				const info = res.items[i]
				if (info && info.index && info.index.error) {
					// bulkErrEm.emit('error', null, info.index)
				}
			}
		}
		// cb()
	})
	bulkBuffer = []
}