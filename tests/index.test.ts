'use strict'

import mongoose, { Document, Schema } from 'mongoose'
import { config } from './config'
import mongoosastic from '../lib/index'
import { Tweet } from './models/tweet'
import { AnyCnameRecord } from 'dns'

const esClient = config.getClient()

// -- Only index specific field
const TalkSchema = new Schema({
	speaker: String,
	year: {
		type: Number,
		es_indexed: true
	},
	title: {
		type: String,
		es_indexed: true
	},
	abstract: {
		type: String,
		es_indexed: true
	},
	bio: String
})

const BumSchema = new Schema({
	name: String
})

const PersonSchema = new Schema({
	name: {
		type: String,
		es_indexed: true
	},
	phone: {
		type: String,
		es_indexed: true
	},
	address: String,
	life: {
		born: {
			type: Number,
			es_indexed: true
		},
		died: {
			type: Number,
			es_indexed: true
		}
	}
})

const DogSchema = new Schema({
	name: { type: String, es_indexed: true }
})

TalkSchema.plugin(mongoosastic)

PersonSchema.plugin(mongoosastic, {
	index: 'people',
	type: 'dude',
	hydrate: true,
	hydrateOptions: {
		lean: true,
		sort: '-name',
		select: 'address name life'
	}
})

BumSchema.plugin(mongoosastic, {
	index: 'ms_sample',
	type: 'bum'
})

DogSchema.plugin(mongoosastic, {
	indexAutomatically: false
})

const Person = mongoose.model('Person', PersonSchema)
const Talk = mongoose.model('Talk', TalkSchema)
const Bum = mongoose.model('bum', BumSchema)
const Dog = mongoose.model('dog', DogSchema)

// -- alright let's test this shiznit!
describe('indexing', function () {
	beforeAll(function (done) {
		mongoose.connect(config.mongoUrl, config.mongoOpts, function () {
			config.deleteDocs([Tweet, Person, Talk, Bum, Dog], function () {
				config.deleteIndexIfExists(['tweets', 'talks', 'people', 'ms_sample', 'dogs'], function () {
					setTimeout(done, config.INDEXING_TIMEOUT as number)
				})
			})
		})
	})

	afterAll(function (done) {
		config.deleteDocs([Tweet, Person, Talk, Bum, Dog], function () {
			config.deleteIndexIfExists(['tweets', 'talks', 'people', 'ms_sample', 'dogs'], function () {
				mongoose.disconnect()
				// Talk.esClient.close()
				// Person.esClient.close()
				// Bum.esClient.close()
				esClient.close()
				done()
			})
		})
	})

	describe('Creating Index', function () {
		it('should create index if none exists', function (done) {
			(Tweet as any).createMapping(undefined, function (err: any, response: any) {
				// should.exists(response)
				expect(response).toBeTruthy()
				// response.should.not.have.property('error')
				expect(response).not.toHaveProperty('error')
				done()
			})
		})

		it('should create index with settings if none exists', function (done) {
			(Tweet as any).createMapping({
				analysis: {
					analyzer: {
						stem: {
							tokenizer: 'standard',
							filter: ['standard', 'lowercase', 'stop', 'porter_stem']
						}
					}
				}
			}, function (err: any, response: any) {
				expect(response).toBeTruthy()
				expect(response).not.toHaveProperty('error')
				done()
			})
		})

		it('should update index if one already exists', function (done) {
			(Tweet as any).createMapping(undefined, function (err: any, response: any) {
				expect(response).not.toHaveProperty('error')
				done()
			})
		})

		afterAll(function (done) {
			config.deleteIndexIfExists(['tweets', 'talks', 'people'], done)
		})
	})

	describe('Default plugin', function () {
		beforeAll(function (done) {
			config.createModelAndEnsureIndex(Tweet, {
				user: 'jamescarr',
				userId: 1,
				message: 'I like Riak better',
				post_date: new Date()
			}, done)
		})

		it('should use the model\'s id as ES id', function (done) {
			Tweet.findOne({
				message: 'I like Riak better'
			}, function (err: any, doc: any) {
				esClient.get({
					index: 'tweets',
					id: doc._id.toString()
				}, function (_err: any, res: any) {
					// res._source.message.should.eql(doc.message)
					expect(res.body._source.message).toEqual(doc.message)
					done()
				})
			})
		})

		it('should be able to execute a simple query', function (done) {
			(Tweet as any).search({
				query_string: {
					query: 'Riak'
				}
			}, {}, function (err: any, results: any) {
				// results.hits.total.should.eql(1)
				expect(results.body.hits.total).toEqual(1)
				// results.hits.hits[0]._source.message.should.eql('I like Riak better')
				expect(results.body.hits.hits[0]._source.message).toEqual('I like Riak better')
				done()
			})
		})

		it('should be able to execute a simple query', function (done) {
			(Tweet as any).search({
				query_string: {
					query: 'jamescarr'
				}
			}, {}, function (err: any, results: any) {
				expect(results.body.hits.total).toEqual(1)
				expect(results.body.hits.hits[0]._source.message).toEqual('I like Riak better')
				done()
			})
		})

		it('should reindex when findOneAndUpdate', function (done) {
			Tweet.findOneAndUpdate({
				message: 'I like Riak better'
			}, {
				message: 'I like Jack better'
			}, {
				new: true
			}, function () {
				setTimeout(function () {
					(Tweet as any).search({
						query_string: {
							query: 'Jack'
						}
					}, {}, function (err: any, results: any) {
						expect(results.body.hits.total).toEqual(1)
						expect(results.body.hits.hits[0]._source.message).toEqual('I like Jack better')
						done()
					})
				}, config.INDEXING_TIMEOUT as number)
			})
		})

		it('should be able to execute findOneAndUpdate if document doesn\'t exist', function (done) {
			Tweet.findOneAndUpdate({
				message: 'Not existing document'
			}, {
				message: 'I like Jack better'
			}, {
				new: true
			}, function (err, doc) {
				// should.not.exist(err)
				// should.not.exist(doc)
				expect(err).toBeFalsy()
				expect(doc).toBeFalsy()
				done()
			})
		})

		// it('should be able to index with insertMany', async function (done) {
		// 	const tweets = [{
		// 		message: 'insertMany 1'
		// 	}, {
		// 		message: 'insertMany 2'
		// 	}]

		// 	await Tweet.insertMany(tweets);

		// 	(Tweet as any).search({
		// 		query_string: {
		// 			query: 'insertMany'
		// 		}
		// 	}, {}, (error: any, results: any) => {
		// 		// results.hits.total.should.eql(2)
				
		// 		expect(results.body.hits.total).toEqual(2)
		// 		const expected = tweets.map((doc) => doc.message)
		// 		const searched = results.body.hits.hits.map((doc: any) => doc._source.message)
		// 		// should(expected.sort()).be.eql(searched.sort())
		// 		expect(expected.sort()).toEqual(searched.sort())
		// 	})
		// })

		it('should report errors', function (done) {
			(Tweet as any).search({
				queriez: 'jamescarr'
			}, {}, function (err: any, results: any) {
				// err.message.should.match(/(SearchPhaseExecutionException|parsing_exception)/)
				expect(err.message).toMatch(/(SearchPhaseExecutionException|parsing_exception)/)
				// should.not.exist(results)
				expect(results).toBeFalsy()
				done()
			})
		})
	})

	describe('Removing', function () {
		let tweet: any = null
		beforeEach(function (done) {
			tweet = new Tweet({
				user: 'jamescarr',
				message: 'Saying something I shouldnt'
			})
			config.createModelAndEnsureIndex(Tweet, tweet, done)
		})

		it('should remove from index when model is removed', function (done) {
			tweet.remove(function () {
				setTimeout(function () {
					(Tweet as any).search({
						query_string: {
							query: 'shouldnt'
						}
					}, {}, function (err: any, res: any) {
						expect(res.body.hits.total).toEqual(0)
						done()
					})
				}, config.INDEXING_TIMEOUT as number)
			})
		})

		it('should remove only index', function (done) {
			tweet.on('es-removed', function () {
				setTimeout(function () {
					(Tweet as any).search({
						query_string: {
							query: 'shouldnt'
						}
					}, {}, function (err: any, res: any) {
						expect(res.body.hits.total).toEqual(0)
						done()
					})
				}, config.INDEXING_TIMEOUT as number)
			})

			tweet.unIndex()
		})

		it('should queue for later removal if not in index', function (done) {
			// behavior here is to try 3 times and then give up.
			const tweet = new Tweet()
			let triggerRemoved = false

			tweet.on('es-removed', function (err: any, res: any) {
				triggerRemoved = true
			})
			tweet.unIndex(function (err: any) {
				// should.exist(err)
				expect(err).toBeTruthy()
				// triggerRemoved.should.eql(true)
				expect(triggerRemoved).toEqual(true)
				done()
			})
		})

		it('should remove from index when findOneAndRemove', function (done) {
			tweet = new Tweet({
				user: 'jamescarr',
				message: 'findOneAndRemove'
			})

			config.createModelAndEnsureIndex(Tweet, tweet, function () {
				Tweet.findByIdAndRemove(tweet._id, {}, () => {
					setTimeout(function () {
						(Tweet as any).search({
							query_string: {
								query: 'findOneAndRemove'
							}
						}, {}, function (err: any, res: any) {
							expect(res.body.hits.total).toEqual(0)
							done()
						})
					}, config.INDEXING_TIMEOUT as number)
				})
			})
		})

		it('should be able to execute findOneAndRemove if document doesn\'t exist', function (done) {
			Tweet.findOneAndRemove({
				message: 'Not existing document'
			}, {}, (err: any, doc: any) => {
				expect(err).toBeFalsy()
				expect(doc).toBeFalsy()
				done()
			})
		})
	})

	describe('Isolated Models', function () {
		beforeAll(function (done) {
			const talk = new Talk({
				speaker: '',
				year: 2013,
				title: 'Dude',
				abstract: '',
				bio: ''
			})
			const tweet = new Tweet({
				user: 'Dude',
				message: 'Go see the big lebowski',
				post_date: new Date()
			})
			tweet.save(function () {
				talk.save(function () {
					talk.on('es-indexed', function () {
						setTimeout(done, config.INDEXING_TIMEOUT as number)
					})
				})
			})
		})

		it('should only find models of type Tweet', function (done) {
			(Tweet as any).search({
				query_string: {
					query: 'Dude'
				}
			}, {}, function (err: any, res: any) {
				// res.hits.total.should.eql(1)
				expect(res.body.hits.total).toEqual(1)
				// res.hits.hits[0]._source.user.should.eql('Dude')
				expect(res.body.hits.hits[0]._source.user).toEqual('Dude')
				done()
			})
		})

		it('should only find models of type Talk', function (done) {
			(Talk as any).search({
				query_string: {
					query: 'Dude'
				}
			}, {}, function (err: any, res: any) {
				// res.hits.total.should.eql(1)
				expect(res.body.hits.total).toEqual(1)
				// res.hits.hits[0]._source.title.should.eql('Dude')
				expect(res.body.hits.hits[0]._source.title).toEqual('Dude')
				done()
			})
		})
	})

	// describe('Always hydrate', function () {
	// 	beforeAll(function (done) {
	// 		config.createModelAndEnsureIndex(Person, {
	// 			name: 'James Carr',
	// 			address: 'Exampleville, MO',
	// 			phone: '(555)555-5555'
	// 		}, done)
	// 	})

	// 	it('when gathering search results while respecting default hydrate options', function (done) {
	// 		Person.search({
	// 			query_string: {
	// 				query: 'James'
	// 			}
	// 		}, function (err, res) {
	// 			res.hits.hits[0].address.should.eql('Exampleville, MO')
	// 			res.hits.hits[0].name.should.eql('James Carr')
	// 			res.hits.hits[0].should.not.have.property('phone')
	// 			res.hits.hits[0].should.not.be.an.instanceof(Person)
	// 			done()
	// 		})
	// 	})
	// })

	// describe('Subset of Fields', function () {
	// 	beforeAll(function (done) {
	// 		config.createModelAndEnsureIndex(Talk, {
	// 			speaker: 'James Carr',
	// 			year: 2013,
	// 			title: 'Node.js Rocks',
	// 			abstract: 'I told you node.js was cool. Listen to me!',
	// 			bio: 'One awesome dude.'
	// 		}, done)
	// 	})

	// 	it('should only return indexed fields', function (done) {
	// 		Talk.search({
	// 			query_string: {
	// 				query: 'cool'
	// 			}
	// 		}, function (err, res) {
	// 			const talk = res.hits.hits[0]._source

	// 			res.hits.total.should.eql(1)
	// 			talk.should.have.property('title')
	// 			talk.should.have.property('year')
	// 			talk.should.have.property('abstract')
	// 			talk.should.not.have.property('speaker')
	// 			talk.should.not.have.property('bio')
	// 			done()
	// 		})
	// 	})

	// 	it('should hydrate returned documents if desired', function (done) {
	// 		Talk.search({
	// 			query_string: {
	// 				query: 'cool'
	// 			}
	// 		}, {
	// 			hydrate: true
	// 		}, function (err, res) {
	// 			const talk = res.hits.hits[0]

	// 			res.hits.total.should.eql(1)
	// 			talk.should.have.property('title')
	// 			talk.should.have.property('year')
	// 			talk.should.have.property('abstract')
	// 			talk.should.have.property('speaker')
	// 			talk.should.have.property('bio')
	// 			talk.should.be.an.instanceof(Talk)
	// 			done()
	// 		})
	// 	})

	// 	describe('Sub-object Fields', function () {
	// 		beforeAll(function (done) {
	// 			config.createModelAndEnsureIndex(Person, {
	// 				name: 'Bob Carr',
	// 				address: 'Exampleville, MO',
	// 				phone: '(555)555-5555',
	// 				life: {
	// 					born: 1950,
	// 					other: 2000
	// 				}
	// 			}, done)
	// 		})

	// 		it('should only return indexed fields and have indexed sub-objects', function (done) {
	// 			Person.search({
	// 				query_string: {
	// 					query: 'Bob'
	// 				}
	// 			}, function (err, res) {
	// 				res.hits.hits[0].address.should.eql('Exampleville, MO')
	// 				res.hits.hits[0].name.should.eql('Bob Carr')
	// 				res.hits.hits[0].should.have.property('life')
	// 				res.hits.hits[0].life.born.should.eql(1950)
	// 				res.hits.hits[0].life.should.not.have.property('died')
	// 				res.hits.hits[0].life.should.not.have.property('other')
	// 				res.hits.hits[0].should.not.have.property('phone')
	// 				res.hits.hits[0].should.not.be.an.instanceof(Person)
	// 				done()
	// 			})
	// 		})
	// 	})

	// 	it('should allow extra query options when hydrating', function (done) {
	// 		Talk.search({
	// 			query_string: {
	// 				query: 'cool'
	// 			}
	// 		}, {
	// 			hydrate: true,
	// 			hydrateOptions: {
	// 				lean: true
	// 			}
	// 		}, function (err, res) {
	// 			const talk = res.hits.hits[0]

	// 			res.hits.total.should.eql(1)
	// 			talk.should.have.property('title')
	// 			talk.should.have.property('year')
	// 			talk.should.have.property('abstract')
	// 			talk.should.have.property('speaker')
	// 			talk.should.have.property('bio')
	// 			talk.should.not.be.an.instanceof(Talk)
	// 			done()
	// 		})
	// 	})
	// })

	// describe('Existing Index', function () {
	// 	beforeAll(function (done) {
	// 		config.deleteIndexIfExists(['ms_sample'], function () {
	// 			esClient.indices.create({
	// 				index: 'ms_sample',
	// 				body: {
	// 					mappings: {
	// 						properties: {
	// 							name: {
	// 								type: 'text'
	// 							}
	// 						}
	// 					}
	// 				}
	// 			}, done)
	// 		})
	// 	})

	// 	it('should just work', function (done) {
	// 		config.createModelAndEnsureIndex(Bum, {
	// 			name: 'Roger Wilson'
	// 		}, function () {
	// 			Bum.search({
	// 				query_string: {
	// 					query: 'Wilson'
	// 				}
	// 			}, function (err, results) {
	// 				results.hits.total.should.eql(1)
	// 				done()
	// 			})
	// 		})
	// 	})
	// })

	// describe('Disable automatic indexing', function () {
	// 	it('should save but not index', function (done) {
	// 		const newDog = new Dog({ name: 'Sparky' })
	// 		newDog.save(function () {
	// 			let whoopsIndexed = false

	// 			newDog.on('es-indexed', function () {
	// 				whoopsIndexed = true
	// 			})

	// 			setTimeout(function () {
	// 				whoopsIndexed.should.be.false()
	// 				done()
	// 			}, config.INDEXING_TIMEOUT)
	// 		})
	// 	})
	// })
})
