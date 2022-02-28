const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const md5 = require('md5');

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect('mongodb://localhost:27017/soccialDB');

const postSchema = {
    content: String,
    likes: Number
}

const Post = new mongoose.model('Post', postSchema)

const userSchema = {
    username: String,
    email: String,
    password: String,
    posts: [postSchema]
}

const User = new mongoose.model('User', userSchema);

let tryOtherUsername = '';
let passwordMessage = ''

app.route('/')
    .get((req, res) => {
        res.render('home')
    });

app.route('/login')
    .get((req, res) => {
        res.render('login', { tryOtherUsername: tryOtherUsername, passwordMessage: passwordMessage })
    })
    .post((req, res) => {
        username = req.body.username;
        password = md5(req.body.password);
        tryOtherUsername = ''
        passwordMessage = ''
        User.findOne({ username: username }, (err, foundUser) => {
            if (err) {
                res.send(err)
            } else {
                if (foundUser) {
                    if (foundUser.password === password) {
                        res.redirect('main/' + username)
                    } else {
                        passwordMessage = "Wrong password, pleas try again"
                        res.render('login', { tryOtherUsername: tryOtherUsername, passwordMessage: passwordMessage })
                    }
                } else {
                    tryOtherUsername = "That user name do not exist, maybe you would like to Sigh up!"
                    res.render('login', { tryOtherUsername: tryOtherUsername, passwordMessage: passwordMessage })
                }
            }
        })
    });

app.route('/register')
    .get((req, res) => {
        res.render('register', { tryOtherUsername: tryOtherUsername })
    })
    .post((req, res) => {
        const username = req.body.username
        tryOtherUsername = ''
        User.findOne({ username: username }, (err, foundUser) => {
            if (err) {
                res.send(err)
            } else {
                if (foundUser) {
                    tryOtherUsername = "That username already exist, perhaps you need to log in."
                    res.render('register', { tryOtherUsername: tryOtherUsername })
                } else {
                    const newUser = new User({
                        username: req.body.username,
                        email: req.body.email,
                        password: md5(req.body.password),
                    });
                    newUser.save((err) => {
                        if (err) {
                            res.send(err)
                        } else {
                            res.redirect('main/' + username)
                        }
                    })
                }
            }
        })
    });

app.route('/main/:username')
    .get((req, res) => {
        const userInfo = req.params.username
        User.findOne({ username: userInfo }, (err, userFound) => {
            res.render('main', { user: userFound })
        })
    });

app.route('/post/:username')
    .get((req, res) => {
        User.findOne({ username: req.params.username }, (err, userFound) => {
            res.render('post', { user: userFound })
        })
    })
    .post((req, res) => {
        const username = req.params.username
        const newPost = new Post({
            content: req.body.postContent,
            likes: 0
        })
        User.findOne({ username: username }, (err, foundUser) => {
            foundUser.posts.push(newPost)
            foundUser.save()
        })
        res.redirect('/main/' + username)


    })



app.listen(3000, () => {
    console.log("App running on port 3000")
})