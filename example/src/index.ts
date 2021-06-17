import express from 'express'
import { Books } from './book.model'

const app = express()
const port = 3000

require('./database') //init the database

app.get('/', (req, res) => {
	res.send('Mongoosastic-plus usage example!')
})

app.get('/books', async (req, res) => {
	const docs = await Books.find({})
	res.send({
		docs: docs
	})
})

app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`)
})