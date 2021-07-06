import express from 'express'
import { Books } from './book.model'
import bodyParser from 'body-parser'

const app = express()
const port = 3000

require('./database') //init the database

app.use( bodyParser.json() )
app.use(bodyParser.urlencoded({
	extended: true
}))

app.get('/', (req, res) => {
	res.send('Mongoosastic-plus usage example!')
})

app.get('/books', async (req, res) => {
	const docs = await Books.find({})
	res.send({
		docs: docs
	})
})

app.post('/books', async (req, res) => {
	const doc = await Books.create(req.body)
	res.send({
		doc: doc
	})
})

app.put('/books/:id', async (req, res) => {
	const { id } = req.params
	const doc = await Books.findOneAndUpdate({ _id: id }, req.body, { new: true })
	res.send({
		doc: doc
	})
})

app.delete('/books/:id', async (req, res) => {
	const { id } = req.params
	const doc = await Books.findOneAndDelete({ _id: id })
	res.send({
		doc: doc
	})
})

app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`)
})