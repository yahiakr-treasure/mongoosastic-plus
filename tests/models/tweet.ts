'use strict'

import mongoose, { Schema } from 'mongoose'
import mongoosastic from '../../lib/index'

// -- simplest indexing... index all fields
const TweetSchema = new Schema({
	user: String,
	userId: Number,
	post_date: Date,
	message: String
})

TweetSchema.plugin(mongoosastic, {
	index: 'tweets',
	type: 'tweet'
})

export const Tweet = mongoose.model('Tweet', TweetSchema)
