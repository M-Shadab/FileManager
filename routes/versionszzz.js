const express = require('express');
const router = express.Router();
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');


//Mongo URI
const mongoURI = 'mongodb://localhost:27017/mongouploads';

//Create Mongo Connection
const conn = mongoose.createConnection(mongoURI);

//INit gridfs Stream
var gfs;

//@route GET /versions
// @desc Loads Form
router.get('/:title', function(req, res) {
	// res.render('index');
	//To get one file
	//gfs.files.findOne({filename: req.params.filename}, function(err, file){
	// gfs.files.find({filename: req.params.filename}).toArray(function(err, files){	
	
	gfs.files.find({title: title}).toArray(function(err, files){	
		if(!files || files.length === 0) {
			return res.render('index', {files: false});
		} else {
			files.map(function(file){
				// console.log('content: '+file.contentType);
				if(file.contentType === 'image/jpeg' || file.contentType === 'image/png'){
					file.isImage = true;
				// console.log('content: '+file.contentType);

				} else {
					file.isImage = false;
				}
			});
			res.render('versions', {files: files});
		}
		//Files Exsit
		// return res.json(files);
	});
}); 

//@route POST /versions/upload
//@desc Uploads file to DB   upload.single('file'), 
router.post('/upload', function(req, res){
	console.log('File Received');
	//res.json({file: req.file});
	res.redirect('/');
});


module.exports = router;