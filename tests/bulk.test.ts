'use strict'

import mongoose from 'mongoose'
import async from 'async'
import { config } from './config'
const Schema = mongoose.Schema
import mongoosastic from '../lib/index'

const BookSchema = new Schema({
	title: String
})

BookSchema.plugin(mongoosastic, {
	bulk: {
		size: 100,
		delay: 1000
	}
})

const Book = mongoose.model('Book', BookSchema)

describe('Bulk mode', function () {
	beforeAll(function (done) {
		config.deleteIndexIfExists(['books'], function () {
			mongoose.connect(config.mongoUrl, config.mongoOpts, function () {
				const client = mongoose.connections[0].db
				client.collection('books', function () {
					Book.deleteMany(done)
				})
			})
		})
	})

	beforeAll(function (done) {
		async.forEach(config.bookTitlesArray(), function (title, cb) {
			new Book({
				title: title
			}).save(cb)
		}, done)
	})

	beforeAll(function (done) {
		Book.findOne({
			title: 'American Gods'
		}, function (err: any, book: any) {			
			book.remove(done)
		})
	})

	afterAll(function (done) {
		config.deleteIndexIfExists(['books'], function () {
			Book.deleteMany(function () {
				mongoose.disconnect()
				done()
			})
		})
	})

	it('should index all objects and support deletions too', function (done) {
		// This timeout is important, as Elasticsearch is "near-realtime" and the index/deletion takes time that
		// needs to be taken into account in these tests
		setTimeout(function () {
			(Book as any).search({
				match_all: {}
			}, {}, function (err: any, results: any) {
				// results.should.have.property('hits').with.property('total', 52)
				expect(results).toHaveProperty('body')
				expect(results.body).toHaveProperty('hits')
				expect(results.body.hits).toHaveProperty('total', 52)
				done()
			})
		}, config.BULK_ACTION_TIMEOUT as number)
	})
})
