const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

const cm = require('./customsessions');
const User = require("./models/usermodel");
const Profile = require("./models/profilemodel");
const Project = require("./models/projectmodel");

const app = express();
const port = 80;
const uri = "mongodb://127.0.0.1/projectshare_database";

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });

// start server
mongoose.set('strictQuery', false);
mongoose.connect(uri)
  .then(() => console.log(`Connected to MongoDB at ${uri}`))
  .catch(error => console.error(`Error connecting to MongoDB at ${uri}`, error))
  .then(() => app.listen(port, () => console.log(`App listening at http://localhost:${port}`)))

cm.sessions.startCleanup();

app.use(express.static('public_html'));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// user login
app.post('/account/login', (req, res) => {
  User.findOne({username: req.body.username}).then((thisUser) => {
    if (thisUser) {
      const hashfx = crypto.createHash('sha3-256');
      const reqHash = hashfx.update(req.body.password + thisUser.salt, 'utf-8').digest('hex');

      if (reqHash == thisUser.hash) {
        let id = cm.sessions.addOrUpdateSession(req.body.username);
        res.cookie('login', {username: req.body.username, sid: id}, {maxAge: cm.sessions.SESSION_LENGTH});
        res.sendStatus(200);
      } else {
        res.sendStatus(401);
      }
    } else {
      res.sendStatus(404);
    }
  });
});

// get username availability
app.get('/account/availability/:username', (req, res) => {
  User.find({username: req.params.username}).then((results) => {
    if (results.length > 0) {
      res.sendStatus(403);
    } else {
      res.sendStatus(200);
    }
  });
});

// create user + profile
app.post('/create/userprofile', upload.single('picture'), (req, res) => {

  const img = fs.readFileSync(req.file.path);
  const encode_img = img.toString('base64');
  const buffer = Buffer.from(encode_img, 'base64');

  const hashfx = crypto.createHash('sha3-256');
  const newSalt = Math.floor((Math.random() * 1000000));
  const newHash = hashfx.update(req.body.password + newSalt, 'utf-8').digest('hex');

  Profile.create({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    bio: req.body.bio,
    picture: {
      data: buffer,
      contentType: req.file.mimetype
    }
  }).then((newProfile) => {
    User.create({
      username: req.body.username,
      salt: newSalt,
      hash: newHash,
      profile: newProfile._id
    }).then(() => {
      res.sendStatus(201);
    });
  }).catch(() => {
    res.sendStatus(400);
  });
});

// create project
app.post('/create/project', upload.single('file'), (req, res) => {

  let file = null;
  let encode_file = null;
  let buffer = null;

  try {
    file = fs.readFileSync(req.file.path);
    encode_file = file.toString('base64');
    buffer = Buffer.from(encode_file, 'base64');

    Project.create({
      title: req.body.title,
      description: req.body.description,
      source_file: {
        filename: req.file.originalname,
        data: buffer,
        contentType: req.file.mimetype
      }
    }).then((newProject) => {
      User.findOne({ username: req.cookies.login.username }).then((thisUser) => {
        Profile.findOne({ _id: thisUser.profile}).then((thisProfile) => {
          thisProfile.projects.push(newProject._id);
          thisProfile.save();
          res.sendStatus(201);
        });
      });
    }).catch(() => {
      res.sendStatus(413);
    });

  } catch (error) {
    res.sendStatus(413);
  }
});

// search profile (by name/phone/email/bio)
app.get('/search/profile/:keyword', (req, res) => {
  const searchOptions = {
    $or: [
      { name: { $regex: req.params.keyword, $options: 'i' } },
      { phone: { $regex: req.params.keyword, $options: 'i' } },
      { email: { $regex: req.params.keyword, $options: 'i' } },
      { bio: { $regex: req.params.keyword, $options: 'i' } }
    ]
  };
  Profile.find(searchOptions).then((results) => {
    res.end(JSON.stringify(results, null, 4));
  });
});

// search project (by title/description)
app.get('/search/project/:keyword', (req, res) => {
  const searchOptions = {
    $or: [
      { title: { $regex: req.params.keyword, $options: 'i' } },
      { description: { $regex: req.params.keyword, $options: 'i' } }
    ]
  };
  Project.find(searchOptions).then((results) => {
    res.end(JSON.stringify(results, null, 4));
  });
});

// check if session is expired
app.get('/session/isloggedin', (req, res) => {
  if (req.cookies.login) {
    const userHasSession = cm.sessions.doesUserHaveSession(req.cookies.login.username, req.cookies.login.sid);
    if (userHasSession) {
      res.sendStatus(200);
    } else {
      res.sendStatus(401);
    }
  } else {
    res.sendStatus(401);
  }
});

// get username from cookies
app.get('/session/username', (req, res) => {
  if (req.cookies.login) {
    res.end(req.cookies.login.username);
  }
});

//get user profile from cookies
app.get('/session/userprofile', (req, res) => {
  if (req.cookies.login) {
    User.findOne({ username: req.cookies.login.username }).then((thisUser) => {
      Profile.findOne({ _id: thisUser.profile }).then((thisProfile) => {
        res.end(JSON.stringify(thisProfile, null, 4));
      });
    });
  }
});

// get profile picture by id
app.get('/profilepicture/:profile_id', (req, res) => {
  Profile.findOne({ _id: req.params.profile_id }).then((thisProfile) => {
    res.contentType(thisProfile.picture.contentType);
    res.send(thisProfile.picture.data);
  });
});

// get project source file by id
app.get('/projectfile/:project_id', (req, res) => {
  Project.findOne({ _id: req.params.project_id }).then((thisProject) => {
    res.contentType(thisProject.source_file.contentType);
    res.send(thisProject.source_file.data);
  });
});
