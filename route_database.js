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
    database: 'midterm',
    multipleStatements: true
});

app.use(session({
    secret: 'COSCI', cookie: { maxAge: 60000000 },
    resave: true, saveUninitialized: false
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// read
app.get('/read', function(req, res){
    if (req.session.isLoggedIn != null && req.session.isLoggedIn == true){
        connection.query('select * from users; select * from files; select * from timestamp', (err, result)=>{
            res.render('dbread.ejs', {
                posts: result[0],
                posts2: result[1],
                posts3: result[2]
            });
        }); 
    }else{
      res.redirect("/login");
    }  
});

// add
app.get('/add', (req,res)=>{
    res.sendFile(path.join(__dirname, "/public/dbadd.html"));  
});

app.post('/add', (req, res)=>{
    const name = req.body.name;
    const filename = req.body.filename;
    const post = {
        name: name,
        filename: filename,
    };
    connection.query('insert into files set ?', post, (err)=>{
        console.log('Created Data Successfully');
    });
    res.redirect('/dbread');
});

// edit
app.get('/edit', (req,res)=>{
    if (req.session.isLoggedIn != null && req.session.isLoggedIn == true){
        connection.query(
            "select * from users where username = ? and password = ?",
            [username, password],
            (error, results, fields)=>{
                if (results) {
                        // go to edit page
                    // res.render('dbedit.ejs', {
                        // change variable name
                    //     post: results[0]
                    // });
                }
            }
        );
    }
});

app.post('/edit', (req, res)=>{
    // const update_username = req.body.username;
    // const update_password = req.body.password;
    // const id = req.params.id;

    connection.query(
        'update users set username = ?, password = ? where id = ?',
        [update_username, update_password, id],
        (err, results)=>{
            if (results.changedRows === 1) {
                console.log('Post Updated');
            }
            return res.redirect('/read');
        }
    );
});

// delete
app.get('/delete/:id-:db', (req, res)=>{
    connection.query(
        'delete from users where id = ?',
        [req.params.id],
        (err, results)=>{
            return res.redirect('/read');
        }
    );
});

module.exports = router_db;