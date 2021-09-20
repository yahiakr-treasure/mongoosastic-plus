'use strict'

import mongoose, { Schema } from 'mongoose'
import { config } from './config'
import mongoosastic from '../lib/index'

const esClient = config.getClient()

const KittenSchema = new Schema({
	name: {
		type: String,
		es_type: 'completion',
		es_analyzer: 'simple',
		es_indexed: true
	},
	breed: {
		type: String
	}
})

KittenSchema.plugin(mongoosastic)

const Kitten = mongoose.model('Kitten', KittenSchema)

const kittens = [
	new Kitten({
		name: 'Cookie',
		breed: 'Aegean'
	}),
	new Kitten({
		name: 'Chipmunk',
		breed: 'Aegean'
	}),
	new Kitten({
		name: 'Twix',
		breed: 'Persian'
	}),
	new Kitten({
		name: 'Cookies and Cream',
		breed: 'Persian'
	})
]

describe('Suggesters', function () {

	beforeAll(async function (done) {
		await mongoose.connect(config.mongoUrl, config.mongoOpts)
		await config.deleteIndexIfExists(['kittens'])

		Kitten.createMapping({}, function () {
			Kitten.deleteMany(function () {
				for (const kitten of kittens) {
					config.saveAndWaitIndex(kitten, function() {
						setTimeout(done, config.INDEXING_TIMEOUT)
					})
				}
			})
		})
	})

	afterAll(async function () {
		await Kitten.deleteMany()
		await config.deleteIndexIfExists(['kittens'])
		mongoose.disconnect()
	})

	describe('Testing Suggest', function () {

		it('should index property name with type completion', function (done) {
			Kitten.createMapping(undefined, function () {
				esClient.indices.getMapping({
					index: 'kittens'
				}, function (err, mapping) {
					const props = mapping.body.kittens.mappings.properties
					expect(props.name.type).toEqual('completion')
					done()
				})
			})
		})

		it('should return suggestions after hits', function (done) {
			Kitten.search({
				match_all: {}
			}, {
				suggest: {
					kittensuggest: {
						text: 'Cook',
						completion: {
							field: 'name'
						}
					}
				}
			}, function (err, res) {
				const body = res?.body
				expect(body).toHaveProperty('suggest')
				expect(body?.suggest?.kittensuggest[0].options.length).toEqual(2)
				done()
			})
		})
	})
})
