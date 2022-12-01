var express = require('express');
var app = express();
var path = require('path')
var bodyParser = require('body-parser');
app.use(express.static(__dirname+'/public'));
app.use(bodyParser.urlencoded({ extended: false }));
var mysql = require('mysql');
const session = require('express-session');

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

app.get('/home', (req, res)=>{
    // go to home
    // res.sendFile(path.join(__dirname, "/public/index.html"));
});

app.get('/login', (req,res)=>{
    // go to login page
    // res.sendFile(path.join(__dirname, "/public/login.html"));  
});

// authen + timestamp
app.post('/authen', (req, res)=>{
    var username = req.body.username;
    var password = req.body.password;

    // timestamp
    // const dateObject = new Date();
    // const date = (`0 ${dateObject.getDate()}`).slice(-2);
    // const month = (`0 ${dateObject.getMonth() + 1}`).slice(-2);
    // const year = dateObject.getFullYear();
    // const hours = dateObject.getHours();
    // const minutes = dateObject.getMinutes();
    // const seconds = dateObject.getSeconds();
    // const finaldate = `${year}-${month}-${date}`;
    // const finaltime = `${hours}:${minutes}:${seconds}`;
    
    const time = {
        username: username,
        date: finaldate,
        time: finaltime
    };

    if (req.session.isLoggedIn != null && req.session.isLoggedIn == true){
        // go to home
        // res.redirect("/academic");
    }

    if (username && password) {
        connection.query(
            "select * from users where username = ? and password = ?",
            [username, password],
            (error, results, fields)=>{
                if (results.length > 0) {
                    req.session.isLoggedIn = true;
                    req.session.username = username;

                    // timestamp
                    // connection.query(
                    //     'insert into timestamp set ?', time, (err)=>{
                    //         console.log('timestamp created', time);
                    //     }
                    // );
                    // connection.query(
                    //     'select count(username) as number from timestamp where username = ?',
                    //     [username],
                    //     (error, result)=>{
                    //         number = result[0].number
                    //         console.log('login count set', number, username)
                    //         connection.query(
                    //             'update users set logincount = ? where username = ?',
                    //             [number, username], (err)=> {
                    //                 console.log('login count updated', number, username);
                    //             }
                    //         );
                    //     }
                    // );

                    // go to home
                    // res.redirect('/academic');
                }
            }
        );
    }
});

app.get('/logout', function(req, res){
    req.session.destroy();
    res.redirect("/home");  
});



var router_db = require('./route_database');
app.use('db',router_db);

app.get('/', (req, res)=>{
    // home
    // res.sendFile(path.join(__dirname, "/public/index.html"));
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