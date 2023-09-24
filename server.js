var express = require('express');
var app = express();
var path = require('path')
var bodyParser = require('body-parser');
app.use(express.static(__dirname+'/public'));
app.use(bodyParser.urlencoded({ extended: true }));
var mysql = require('mysql');
const session = require('express-session');
var bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

app.set('views', path.join(__dirname+'/public', 'html'));
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
    if (req.session.loggedin == true) {
        res.redirect('/courses')
    } else {
        // go to login page
        res.sendFile(path.join(__dirname, "/public/html/index.html")); 
    } 
});

app.get('/signup', (req, res)=>{
    res.sendFile(path.join(__dirname, "/public/html/register.html")); 
});

app.post('/signup', (req, res)=>{
    const user_buasri = req.body.buasri_id;
    const user_password = req.body.password;

    if (user_buasri && user_password) {
        bcrypt.genSalt(10, (err, salt)=>{
            bcrypt.hash(user_password, salt, (err, hash)=>{
                connection.query(
                    'update users set password = ? where buasri_id = ?',
                    [hash, user_buasri],
                    (err)=>{
                        if (err) {console.error();}
                        res.redirect('/login');
                    }
                )
            })
        })
    } else {
        res.redirect('/login');
    }
});

app.post('/authen', (req, res)=>{
    var user_buasri = req.body.buasri_id;
    var user_password = req.body.password;

    if (user_buasri && user_password) {
        connection.query(
            'select * from users where buasri_id = ?', user_buasri,
            (err, results)=>{
                if (err) {console.error();}

                if (results.length > 0) {
                    bcrypt.compare(user_password, results[0].password, (err, result)=>{
                        if (result == true) {
                            req.session.loggedin = true;
                            req.session.userID = user_buasri;
                            res.redirect('/courses');
                        } 
                    })
                } 
            }
        )
    } 
});

app.get('/forget', (req, res)=>{
    // forget password page
    res.sendFile(path.join(__dirname, "/public/html/forget.html")); 
})

app.post("/forget", function(req, res) {
    var user_buasri = req.body.buasri_id;
  
    if (user_buasri) {
        connection.query(
            "SELECT * FROM users WHERE buasri_id = ?", user_buasri, 
            function(errM, rowM) {
                if (errM) {console.error();}
  
                if (rowM.length > 0) {
                    let randomPass = Math.random().toString(36).substring(2, 10);
  
                    var emails = rowM[0].email;
                    var subject = "รหัสผ่านของคุณมีการเปลี่ยนแปลง";
                    var html = "สวัสดี คุณ " + rowM[0].username + "<br><br>" +
                        "&nbsp;&nbsp;รหัสผ่านเว็บไซต์ COSCI Attendance ของคุณมีการเปลี่ยนแปลงตามที่คุณร้องขอ<br>" + 
                        "รหัสผ่านใหม่ของคุณ คือ &nbsp;" + randomPass + "<br>" +
                        "ให้ใช้รหัสผ่านนี้ในการเข้าสู่ระบบ และคุณสามารถเปลี่ยนแปลงรหัสผ่านของคุณได้หลังจากเข้าสู่ระบบแล้ว" + "<br><br><br>ขอบคุณ<br>COSCI Attendance";
                    sendmail(emails, subject, html);
                    console.log(emails);
  
                    // Update Password
                    bcrypt.genSalt(10, function(err, salt) {
                        bcrypt.hash(randomPass, salt, function(err, hash) {
                            connection.query(
                                "UPDATE users SET password = ? WHERE buasri_id = ?", [hash, user_buasri],
                                function(err) {
                                    if (err) {console.error();}
                                }
                            );
                        });
                    });
                }
            }
        );
    }
})

app.get('/logout', function(req, res){
    req.session.destroy();
    res.redirect("/login");  
});



var router_db = require('./route_database');
app.use(router_db);

app.get('/', (req, res)=>{
    res.redirect('/login')
});

app.get('/error', (req, res)=>{
    // not found
    res.sendFile(path.join(__dirname, "/public/html/404page.html"));
});

app.get('*', (req, res)=>{
    res.redirect('/error')
});

function sendmail(toemail, subject, html) {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        service: 'gmail',  
        auth: {
            user: '',   // your email
            pass: ''    // for app password
        }
    });

    // send mail with defined transport object
    let mailOptions = {
        from: '"COSCI - Forgot Password" <koppok32a@gmail.com>',  // sender address
        to: toemail,    // list of receivers
        subject: subject,   // Subject line
        // text: textMail
        html: html     // html mail body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            res.send('เกิดข้อผิดพลาด ไม่สามารถส่งอีเมลได้ โปรดลองใหม่ภายหลัง');
        }
        else {
            // console.log('INFO EMAIL:', info);
            console.log("send email successful");
        }
    });
}

const PORT = process.env.PORT || 5005;
var server = app.listen(PORT, ()=>{
    console.log("Listening at port",PORT);
});
