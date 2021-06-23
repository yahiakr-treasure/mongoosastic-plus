import { Document, LeanDocument } from 'mongoose'

export function getIndexName(doc: Document, indexName: string): string {
	const modelName = doc.collection.name
	if (!indexName) return modelName
	else return indexName
}

export function serialize(doc: Document): LeanDocument<Document> {
	const body = doc.toObject()
	delete body['_id']

	return body
}