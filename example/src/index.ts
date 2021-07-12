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

app.get('/sync', (req, res) => {
	const stream = (Books as any).synchronize()
	let count = 0
	stream.on('data', function () {
		count++
		console.log('index document with ES', count)
	})
	stream.on('close', function () {
		console.log('number of legal texts indexed with ES is : ', count)
	})
	stream.on('error', function (err: any) {
		console.log('there been an error', err)
	})
	res.send('SYNCHRONIZING...')
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