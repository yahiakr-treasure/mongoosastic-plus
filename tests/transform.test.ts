'use strict'

import mongoose, { Schema } from 'mongoose'
import { config } from './config'
import mongoosastic from '../lib/index'

// -- Only index specific field
const RepoSchema = new Schema({
	name: {
		type: String,
		es_indexed: true
	},
	settingLicense: {
		type: String
	},
	detectedLicense: {
		type: String
	}
})

RepoSchema.plugin(mongoosastic, {
	transform: function (data: any, repo: any) {
		data.license = repo.settingLicense || repo.detectedLicense
		return data
	}
})

const Repo = mongoose.model('Repo', RepoSchema)

describe('Transform mode', function () {

	beforeAll(async function() {
		await config.deleteIndexIfExists(['repos'])
		await mongoose.connect(config.mongoUrl, config.mongoOpts)
		await Repo.deleteMany()
	})

	afterAll(async function() {
		await Repo.deleteMany()
		await config.deleteIndexIfExists(['repos'])
		mongoose.disconnect()
	})

	it('should index with field "fullTitle"', function (done) {
		config.createModelAndEnsureIndex(Repo, {
			name: 'LOTR',
			settingLicense: '',
			detectedLicense: 'Apache'
		}, function (err: any, doc: any) {
			Repo.search({
				query_string: {
					query: 'Apache'
				}
			}, {}, function (err, results) {
				if (err) {
					return done(err)
				}

				expect(results?.body.hits.total).toEqual(1)
				done()
			})
		})
	})
})
