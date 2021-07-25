'use strict'

import { Client } from '@elastic/elasticsearch'
import async, { ErrorCallback } from 'async'
import { Model } from 'mongoose'
import { PluginDocument } from 'types'

const esClient = new Client({ node: 'http://localhost:9200' })

const INDEXING_TIMEOUT = process.env.INDEXING_TIMEOUT || 2000
const BULK_ACTION_TIMEOUT = process.env.BULK_ACTION_TIMEOUT || 4000

function deleteIndexIfExists(indexes: Array<string>, done: ErrorCallback): void {
	async.forEach(indexes, function (index, cb) {
		esClient.indices.exists({
			index: index
		}, function (err, exists) {
			if (exists) {
				esClient.indices.delete({
					index: index
				}, cb)
			} else {
				cb()
			}
		})
	}, done)
}

function deleteDocs(models: Array<Model<PluginDocument>>, done: ErrorCallback): void {
	async.forEach(models, function (model, cb) {
		model.deleteMany(cb)
	}, done)
}

function createModelAndEnsureIndex(Model: Model<any>, obj: any, cb: CallableFunction): void {
	const doc = new Model(obj)
	doc.save(function (err: any) {
		if (err) return cb(err)

		doc.on('es-indexed', function () {
			setTimeout(function () {
				cb(null, doc)
			}, (INDEXING_TIMEOUT as number))
		})
	})
}

function createModelAndSave (Model: Model<any>, obj: any, cb: CallableFunction) {
	const dude = new Model(obj)
	dude.save(cb)
}

function saveAndWaitIndex (Model: any, cb: any) {
	Model.save(function (err: any) {
		if (err) cb(err)
		else {
			Model.once('es-indexed', cb)
			Model.once('es-filtered', cb)
		}
	})
}

function bookTitlesArray () {
	const books = [
		'American Gods',
		'Gods of the Old World',
		'American Gothic'
	]
	let idx
	for (idx = 0; idx < 50; idx++) {
		books.push('ABABABA' + idx)
	}
	return books
}

export const config = {
	mongoUrl: 'mongodb://localhost/mongoosastic-test',
	mongoOpts: {
		useNewUrlParser: true,
		useFindAndModify: false,
		useUnifiedTopology: true
	},
	INDEXING_TIMEOUT: INDEXING_TIMEOUT,
	BULK_ACTION_TIMEOUT: BULK_ACTION_TIMEOUT,
	deleteIndexIfExists: deleteIndexIfExists,
	deleteDocs: deleteDocs,
	createModelAndEnsureIndex: createModelAndEnsureIndex,
	createModelAndSave: createModelAndSave,
	saveAndWaitIndex: saveAndWaitIndex,
	bookTitlesArray: bookTitlesArray,
	getClient: function () {
		return esClient
	},
	close: function () {
		esClient.close()
	}
}

