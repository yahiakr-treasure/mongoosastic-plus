import mongoose from 'mongoose'

mongoose.connect(
	'mongodb://localhost:27017/mongoosastic',
	{
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false,
	}
)
	.then(() => console.log('MongoDB Connected'))
	.catch((err: any) => console.log(err))