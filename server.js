var express = require('express');
var app = express();
var path = require('path')
var bodyParser = require('body-parser');
app.use(express.static(__dirname+'/public'));
app.use(bodyParser.urlencoded({ extended: false }));
var mysql = require('mysql');
const session = require('express-session');
var bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

app.set('views', path.join(__dirname+'/public', 'views'));
app.set('view engine', 'ejs');

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'final',
    multipleStatements: true
});

app.use(session({
    secret: 'COSCI', cookie: { maxAge: 60000000 },
    resave: true, saveUninitialized: false
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/login', (req,res)=>{
    if (session.loggedin == true) {
        // after login page
        // res.render('')
    } else {
        // go to login page
        // res.sendFile(path.join(__dirname, "/public/login.html")); 
    } 
});

app.get('/signup', (req, res)=>{
    // res.render('signup.ejs')
});

app.post('/signup', (req, res)=>{
    const user_buasri = req.body.username;
    const user_mail = req.body.email;
    const user_password = req.body.password;

    if (user_buasri && user_password) {
        bcrypt.genSalt(10, (err, salt)=>{
            console.log(salt);
            console.log(user_buasri,user_mail,user_password);
            bcrypt.hash(user_password, salt, (err, hash)=>{
                connection.query(
                    'insert into accounts set username = ?, password = ?, email = ?',
                    [user_buasri, hash, user_mail],
                    (err)=>{
                        if (err) {console.error();}

                        req.session.loggedin = true;
                        req.session.userID = user_buasri;

                        res.redirect('/checklogin');
                    }
                )
            })
        })
    } else {
        res.redirect('/');
    }
});

app.post('/authen', (req, res)=>{
    var user_buasri = req.body.username;
    var user_password = req.body.password;

    if (user_buasri && user_password) {
        connection.query(
            'select * from accounts where username = ?', user_buasri,
            (err, results)=>{
                if (err) {console.error();}

                if (results.length > 0) {
                    bcrypt.compare(user_password, results[0].password, (err, result)=>{
                        if (result == true) {
                            req.session.loggedin = true;
                            req.session.userID = results[0].username;
                            
                            console.log(user_password, results[0].password);
                            console.log(result);
                            res.redirect('/webboard');
                        } else {
                            // res.render('index_error.ejs', {
                            //     message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
                            //     username: user_buasri
                            // });
                        }
                    })
                } else {
                    // res.render('index_error.ejs', {
                    //     message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง<br>(หากยังไม่เคยใช้งานเว็บไซต์นี้ ให้สมัครสมาชิกก่อน)',
                    //     username: user_buasri
                    // })
                }
            }
        )
    } else {
        // res.render('index_error.ejs', { 
        //     message: 'โปรดใส่ข้อมูลให้ครบถ้วน!!',
        //     username: user_buasri
        // })
    }
});

app.get('/logout', function(req, res){
    req.session.destroy();
    res.redirect("/home");  
});



var router_db = require('./route_database');
app.use('db',router_db);

app.get('/', (req, res)=>{
    res.redirect('/login')
});

app.get('/error', (req, res)=>{
    // not found
    // res.sendFile(path.join(__dirname, "/public/notfound.html"));
});

app.get('*', (req, res)=>{
    res.redirect('/error')
});

var server = app.listen(5005, ()=>{
    var host = server.address().address;
    var port = server.address().port;
    console.log("Listening at htttp://%s%s", host, port);
});