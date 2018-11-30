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

const app = express();

app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.use(expressLayouts);

//ejs automatically Find view to views folder
app.set('view engine', 'ejs');

//Mongo URI
const mongoURI = 'mongodb://localhost:27017/mongouploads';

//Create Mongo Connection
const conn = mongoose.createConnection(mongoURI);

//Set Public Folder 
app.use(express.static(path.join(__dirname, 'public')));

//INit gridfs Stream
var gfs;

conn.once('open', function(){
	//Init stream
	gfs = Grid(conn.db, mongoose.mongo);
	console.log('connected to mongo DB');
	//Collection name to db : uploads. files   uplods.chunks
	gfs.collection('uploads');
});

//Create Strorage Engine - Multer gridfs storage system
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads' //Should match to cllection name
        };
        resolve(fileInfo);
      });
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
	gfs.files.find().toArray(function(err, files){	
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
			res.render('index', {files: files});
		}
		//Files Exsit
		// return res.json(files);
	});
}); 

//@route POST /upload
//@desc Uploads file to DB
app.post('/upload', upload.single('file'), function(req, res){
	console.log('File Received');
	//res.json({file: req.file});
	res.redirect('/');
});

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
		console.log('filename: '+req.params.filename );
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

//Create port
app.listen(3000, function(){
	console.log('Server started on port 3000...');
});