import { Document } from 'mongoose'
import { getIndexName } from './utils'


export function index(doc: Document, options: Options): void {
	const index = getIndexName(doc, options.index)    
}