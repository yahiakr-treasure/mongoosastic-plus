'use strict'

import mongoose, { Schema } from 'mongoose'
import async from 'async'
import { config } from './config'
import mongoosastic from '../lib/index'

const BookSchema = new Schema({
	title: {
		type: String,
		required: true
	}
})

BookSchema.plugin(mongoosastic)

let saveCounter = 0
BookSchema.pre('save', function (next) {
	// Count save
	++saveCounter
	next()
})

const Book = mongoose.model('Book', BookSchema)

describe('Synchronize', () => {
	let books: any

	const clearData = (cb: CallableFunction) => {
		config.deleteIndexIfExists(['books'], () => {
			mongoose.connect(config.mongoUrl, config.mongoOpts, () => {
				const client = mongoose.connections[0].db
				client.collection('books', (err, _books) => {
					books = _books
					Book.deleteMany(cb)
				})
			})
		})
	}

	afterAll(done => {
		Book.deleteMany(function () {
			config.deleteIndexIfExists(['books'], () => {
				// Book.esClient.close()
				mongoose.disconnect()
				done()
			})
		})
	})

	describe('an existing collection with invalid field values', () => {
		beforeAll(done => {
			clearData(() => {
				async.forEach(config.bookTitlesArray(), (title, cb) => {
					books.insertOne({
						title: title
					}, cb)
				}, () => {
					books.insertOne({
					}, done)
				})
			})
		})

		it('should index all but one document', done => {
			saveCounter = 0
			const stream = Book.synchronize()
			let count = 0
			let errorCount = 0
			stream.on('data', () => {
				count++
			})
			stream.on('error', () => {
				errorCount += 1
			})
			stream.on('close', () => {
				// count.should.eql(53)
				expect(count).toEqual(53)
				// saveCounter.should.eql(count)
				expect(saveCounter).toEqual(count)

				setTimeout(() => {
					Book.search({
						query_string: {
							query: 'American'
						}
					}, {}, (err, results) => {
						try {
							expect(results?.body.hits.total).toEqual(2)
							expect(errorCount).toEqual(1)
						} catch (error) {
							done(error)	
						}
					})
				}, config.INDEXING_TIMEOUT)
			})
		})
	})

	describe('an existing collection', () => {
		beforeAll(done => {
			clearData(() => {
				async.forEach(config.bookTitlesArray(), (title, cb) => {
					books.insertOne({
						title: title
					}, cb)
				}, done)
			})
		})

		it('should index all existing objects', done => {
			saveCounter = 0
			const stream = Book.synchronize()
			let count = 0
			// const stream = Book.synchronize({}, {saveOnSynchronize: true}), // default behaviour

			stream.on('data', () => {
				count++
			})

			stream.on('close', () => {
				// count.should.eql(53)
				expect(count).toEqual(53)
				// saveCounter.should.eql(count)
				expect(saveCounter).toEqual(count)

				setTimeout(() => {
					Book.search({
						query_string: {
							query: 'American'
						}
					}, {}, (err, results) => {
						// results.hits.total.should.eql(2)
						expect(results?.body.hits.total).toEqual(2)
						done()
					})
				}, config.INDEXING_TIMEOUT)
			})
		})

		it('should index all existing objects without saving them in MongoDB', done => {
			saveCounter = 0
			const stream = Book.synchronize({}, { saveOnSynchronize: false })
			let count = 0

			stream.on('data', (err, doc) => {
				if (doc._id) count++
			})

			stream.on('close', () => {
				expect(count).toEqual(53)
				// saveCounter.should.eql(count)
				expect(saveCounter).toEqual(0)

				setTimeout(() => {
					Book.search({
						query_string: {
							query: 'American'
						}
					}, {}, (err, results) => {
						// results.hits.total.should.eql(2)
						expect(results?.body.hits.total).toEqual(2)
						done()
					})
				}, config.INDEXING_TIMEOUT)
			})
		})
	})
})
