const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');
// const versions = require('./routes/versions'); 


const app = express();

app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.use(expressLayouts);


// app.use('/versions', versions);

app.use(express.static(path.join(__dirname, 'public')));

//Bring in Models
var Uploadfile = require('./models/uploadfiles');

//ejs automatically Find view to views folder
app.set('view engine', 'ejs');

//Mongo URI
const mongoURI = 'mongodb://localhost:27017/mongouploadsNew';
/*
//Create Mongo Connection
const conn = mongoose.createConnection(mongoURI);*/


mongoose.connect('mongodb://localhost:27017/mongouploadsNew')
	.then(() => console.log('Connected to mongodb...'))
	.catch(err => console.log('Could not connect to MongoDb...',err));
const conn = mongoose.connection;

//INit gridfs Stream
var gfs;

conn.once('open', function(){
	//Init stream
	gfs = Grid(conn.db, mongoose.mongo);
	console.log('connected to mongo DB');
	//Collection name to db : uploads. files   uplods.chunks
	gfs.collection('uploadfiles');
});

 
//Create Strorage Engine - Multer gridfs storage system
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {

    	var str = file.originalname;

    	//var str = String(req.file.originalname);//file; 'Safari.txt';//
	// console.log('file:', str);
  		var pos = str.indexOf('.');
  		var name = file.originalname;//str.slice(0, pos);

        const fileInfo = {
          filename: Date.now() +'_'+file.originalname,// + str + path.extname(file.originalname),
          metadata: name,
          bucketName: 'uploadfiles' //Should match to cllection name
        };

        resolve(fileInfo);
      });
    } 
});

const upload = multer({ storage });
 
//@route GET /
// @desc Loads Form
app.get('/', function(req, res) {
	// res.render('index');
	//To get one file
	//gfs.files.findOne({filename: req.params.filename}, function(err, file){
	// gfs.files.find({filename: req.params.filename}).toArray(function(err, files){	
	
	Uploadfile.find({}, function(err, files){	
		if(!files || files.length === 0) {
			return res.render('index', {files: false});
		} else {
			/*files.map(function(file){
				// console.log('content: '+file.contentType);
				if(file.contentType === 'image/jpeg' || file.contentType === 'image/png'){
					file.isImage = true;
				// console.log('content: '+file.contentType);

				} else {
					file.isImage = false;
				}
			});*/
			res.render('index', {files: files});
		}
		//Files Exsit
		// return res.json(files);
	});
}); 


//@route GET /versions
// @desc Loads Form
app.get('/versions/:title', function(req, res) {
	// res.render('index');
	//To get one file
	//gfs.files.findOne({filename: req.params.filename}, function(err, file){
	// gfs.files.find({filename: req.params.filename}).toArray(function(err, files){	
	var name = req.params.title;
	console.log('name: ', name);

	gfs.files.find({metadata: name}).toArray(function(err, files){	
		
		console.log('length: ', files.length);

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

app.get('/versions/delete/:id/:title', function(req, res){
	// gfs.collection('uploadfiles');
	console.log('ID: ', req.params.id);
	gfs.files.remove({_id: mongoose.Types.ObjectId(req.params.id)}, function(err){
		if(err) {
			return handleError(err);
		}
			console.log('Deleted');
			var str = String(req.params.title);//String(req.file.originalname);//file; 'Safari.txt';//
			// console.log('file:', str);
  			var pos = str.indexOf('_');
  			var name = str.slice(pos + 1, str.length);//req.file.originalname;//str.slice(0, pos);
  			console.log('name Come:', name);

  			//Update Uploadfile Collection To value--
  			var containerSize = updateCount(name, -1);
			
			if(containerSize == 0){
				console.log('Container Deleted');
				res.redirect('/');
			}
			// Uploadfile.find({title: name}, function(err, files){
			// 	if(err){
			// 		console.log('err: ', err);
			// 	} 
			// 	console.log('LEN:', files.length);
			// 	//Empty Container :: redirect to Home
			// 	//Due Async nature Ut takes Little time to Update Delete status And len still show 1 While
			// 	//it's being deleted
			// 	if(files.length == 0){
			// 		console.log('Container Deleted');
			// 		res.redirect('/');
			// 	}

			// });
			console.log('Container Filled');

			res.redirect('/');//versions/'+name);
	});
});

function updateCount(name, value){
	//Query first
	/*const file = await Uploadfile.find({title: name});
	if(!file)	return;
	file[0].count = file[0].count + 1;

	const result = await file[0].save();
	console.log(result); */
	var newFile = {};
	newFile.title = name;

	Uploadfile.find({title: name}, function(err, files){
		if(err)	return res.send(err);
		newFile.count = files[0].count + value;
	});


	Uploadfile.update({title: name}, newFile, function(err){
		if(err){
			console.log('err: ', err);
		} 
		console.log('files[0]: ', newFile);
				// return;
	});

	if(newFile.count == 0){
		console.log('Contaner Become Empty');

			//Delete the Empty Container Itself
		Uploadfile.deleteOne({title: name}, function(err){
				// if(err)	console.log(err);
			console.log('Contaner 1 Become Empty');
		});
		return 0;
	}
	return 1;
}

function saveFile(name){
	var uploadfile = new Uploadfile();
	uploadfile.title = name;
	uploadfile.count = 1;

	uploadfile.save(function(err){
		if(err){
			console.log(err);
			return;
		} else{
			console.log('Uploaded File: ', uploadfile);
			// res.render('index', {files: false});
		}
	});
}

//@route POST /upload upload.single('file'),
//@desc Uploads file to DB
app.post('/upload', upload.single('file'), function(req, res){
	console.log('File Received');
	//res.json({file: req.file});
	var str = String(req.file.originalname);//file; 'Safari.txt';//
	// console.log('file:', str);
  	var pos = str.indexOf('.');
  	var name = req.file.originalname;//str.slice(0, pos);

	// console.log('name:', name);

	// var uploadfile = new Uploadfile();
	// uploadfile.title = name;
	// uploadfile.count = 1;

	Uploadfile.find({title: name}, function(err, files){
		if(err){
			console.log(err);
			return;
		} else {
			if(files.length > 0){
				console.log('File is Present, Update the Count ');
				updateCount(name, 1);

			} else {
				console.log('file is Not Present in DB, Insert into DB... ');
				//Save the File
				saveFile(name);
				/*uploadfile.save(function(err){
					if(err){
						console.log(err);
						return;
					} else{
						console.log(uploadfile);
					// res.render('index', {files: false});
					}
				})*/
				//const res = await uploadfile.save();
				// saveFile(name);
			}
			// res.render('index', {files: false});
		}
	});
	/*uploadfile.save(function(err){
		if(err){
			console.log(err);
			return;
		} else{
			console.log(uploadfile);
			res.render('index', {files: false});
		}
	});*/
	res.redirect('/');
});
//Set Public Folder 


// @route Get /files
// @desc Display all files in JSON
// using gridfs stream
app.get('/files', function(req, res){
	gfs.files.find().toArray(function(err, files){
		if(!files || files.length === 0) {
			return res.status(404).json({
				err: 'No files exist'
			});
		}

		//Files Exsit
		return res.json(files);
	});
});

// Route to each file
// @route Get /image/:filename
// @desc Display all files in JSON
// using gridfs stream
app.get('/image/:filename', function(req, res){
	//To get one file
	gfs.files.findOne({filename: req.params.filename}, function(err, file){
		if(!file || file.length === 0) {
			return res.status(404).json({
				err: 'No files exist'
			});
		}

		//Files Exsit
		// return res.json(file);
		//Check if image
		if(file.contentType === 'image/jpeg' || file.contentType === 'image/png' ){
			//Read o/p to browser
			const readstream = gfs.createReadStream(file.filename);
			readstream.pipe(res);
		} else {
			res.status(404).json({
				err: 'Not an image'
			});
		}
	});
});

//Route to each file
// @route Get /files/:filename
// @desc Display all files in JSON
// using gridfs stream
app.get('/files/:filename', function(req, res){
	//To get one file
	gfs.files.findOne({filename: req.params.filename}, function(err, file){
		if(err || !file || file.length === 0) {
			return res.status(404).json({
				err: 'No files exist'
			});
		}

		//Files Exsit
		return res.json(file);
	});
});


// Show a text file from MongoDB to Browser
    app.get('/show/:filename', (req, res) => {
        // Check file exist on MongoDB
		
		// var filename = req.query.filename;
		console.log('filename: '+req.params.filename );
        gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
            if (err || !file) {
                res.status(404).send('File Not Found');
				return
            } 

		const readstream = gfs.createReadStream({ filename: req.params.filename });
			
		if(file.contentType === 'text/plain' || file.contentType === 'application/pdf'){
			//Below Format Does not supported by Chrome Browser to open Inside Chrome Browser
			//|| file.contentType === 'application/msword' || file.contentType === 'video/mp4'
			//Read o/p to browser
			console.log('text-File');
			readstream.pipe(res);
		} else{
			res.redirect('/download/'+req.params.filename);
		}
			/*var readstream = gfs.createReadStream({ filename: req.params.filename });
			//Set Content-type to application/octet-stream' so that brower does not know type of doc
			//and thus forec to download rather then display/open in browser itself
			res.set('Content-Type', 'application/octet-stream');
			readstream.pipe(res);       */
			// res.download(readstream);     
        });
    });

// Download a file from MongoDB - then save to local file-system
    app.get('/download/:filename', (req, res) => {
        // Check file exist on MongoDB
		
		// var filename = req.query.filename;
		//console.log('filename: '+req.params.filename );
        gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
            if (err || !file) {
                res.status(404).send('File Not Found');
				return
            } 
			
			const readstream = gfs.createReadStream({ filename: req.params.filename });
			//Set Content-type to application/octet-stream' so that brower does not know type of doc
			//and thus forec to download rather then display/open in browser itself
			res.set('Content-Type', 'application/octet-stream');
			readstream.pipe(res);       
			// res.download(readstream);     
        });
    });


async function addFile(){
	var uploadfile = new Uploadfile();
	uploadfile.title = 'lambo';
	uploadfile.count = 1;
	
	const res = await uploadfile.save();
	console.log(res);	
}

// addFile();


//Create port
app.listen(3000, function(){
	console.log('Server started on port 3000...');
});