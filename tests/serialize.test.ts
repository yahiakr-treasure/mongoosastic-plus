'use strict'

import mongoose, { Schema } from 'mongoose'
import Generator from '../lib/mapping'
const generator = new Generator()
import { serialize } from '../lib/utils'

const BowlingBall = mongoose.model('BowlingBall', new Schema())
const PersonSchema = new Schema({
	name: {
		first: String,
		last: String
	},
	dob: Date,
	bowlingBall: {
		type: Schema.Types.ObjectId,
		ref: 'BowlingBall'
	},
	games: [{
		score: Number,
		date: Date
	}],
	somethingToCast: {
		type: String,
		es_cast: function (element: any) {
			return element + ' has been cast'
		}
	}
})

const Person = mongoose.model('Person', PersonSchema)

const mapping = generator.generateMapping(PersonSchema)

describe('serialize', function () {
	const dude = new Person({
		name: {
			first: 'Jeffrey',
			last: 'Lebowski'
		},
		dob: new Date(Date.parse('05/17/1962')),
		bowlingBall: new BowlingBall(),
		games: [{
			score: 80,
			date: new Date(Date.parse('05/17/1962'))
		}, {
			score: 80,
			date: new Date(Date.parse('06/17/1962'))
		}],
		somethingToCast: 'Something'
	})

	// another person with missing parts to test robustness
	const millionnaire = new Person({
		name: {
			first: 'Jeffrey',
			last: 'Lebowski'
		}
	}).toObject()

	it('should serialize a document with missing bits', function () {
		const serialized = serialize(millionnaire, mapping)
		// serialized.should.have.property('games', [])
		expect(serialized).toHaveProperty('games', [])
	})

	describe('with no indexed fields', function () {
		const serialized = serialize(dude, mapping)
		it('should serialize model fields', function () {
			// serialized.name.first.should.eql('Jeffrey')
			expect(serialized.name.first).toEqual('Jeffrey')
			// serialized.name.last.should.eql('Lebowski')
			expect(serialized.name.last).toEqual('Lebowski')
		})

		it('should serialize object ids as strings', function () {
			// serialized.bowlingBall.should.eql(dude.bowlingBall)
			expect(serialized.bowlingBall).toEqual(dude.bowlingBall)
			// serialized.bowlingBall.should.be.type('object')
			expect(typeof serialized.bowlingBall).toBe('object')
		})

		it('should serialize dates in ISO 8601 format', function () {
			// serialized.dob.should.eql(dude.dob.toJSON())
			expect(serialized.dob).toEqual(dude.dob.toJSON())
		})

		it('should serialize nested arrays', function () {
			// serialized.games.should.have.lengthOf(2)
			expect(serialized.games).toHaveLength(2)
			// serialized.games[0].should.have.property('score', 80)
			expect(serialized.games[0]).toHaveProperty('score', 80)
		})

		it('should cast and serialize field', function () {
			// serialized.somethingToCast.should.eql('Something has been cast')
			expect(serialized.somethingToCast).toEqual('Something has been cast')
		})
	})
})
