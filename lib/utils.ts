import { Document } from 'mongoose'

export function getIndexName(doc: Document, indexName: string): string {
	const modelName = doc.modelName
	if (!indexName) return `${modelName}s`
	else return indexName
}