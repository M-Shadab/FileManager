const mongoose = require('mongoose');

const uploadfilesSchema = new mongoose.Schema({
	title:{
		type: String,
		required: true
	},
	count:{
		type: Number,
		min: 0
	}
});

var Uploadfile = module.exports = mongoose.model('Uploadfile', uploadfilesSchema);