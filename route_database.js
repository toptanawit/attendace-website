var express = require('express');
// var app = express();
var path = require('path')
var bodyParser = require('body-parser');
router_db.use(express.static(__dirname+'/public'));
router_db.use(bodyParser.urlencoded({ extended: false }));
var mysql = require('mysql');
const session = require('express-session');
var router_db = express.Router();

// router_db.set('views', path.join(__dirname+'/public', 'views'));
// router_db.set('view engine', 'ejs');

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'final',
    multipleStatements: true
});

// router_db.use(session({
//     secret: 'COSCI', cookie: { maxAge: 60000000 },
//     resave: true, saveUninitialized: false
// }));

// router_db.use(express.urlencoded({ extended: true }));
// router_db.use(express.json());

// read
router_db.route('/courses')
.get( function(req, res){
    if (req.session.isLoggedIn != null && req.session.loggedin == true && req.session.userID != 'admin'){
        connection.query('select * from subject s , user u where s.teacher = u.buasri_id and u.buasri_id = ?', req.session.userID, (err, result)=>{
            res.render('courses.ejs', {
                courses: result
            })
        }); 
    } else if (req.session.isLoggedIn != null && req.session.loggedin == true && req.session.userID == 'admin') {
        connection.query('select * from subject',(err, result)=>{
            res.render('courses.ejs', {
                courses: result
            })
        })
    } else {
      res.redirect("/login");
    }  
});

router_db.route('/students')
.get((req,res)=>{
    connection.query('select * from users where status = Student',(err,result)=>{
        res.render('students.ejs', {
            students: result
        })
    }) 
});

router_db.route('/teachers')
.get((req,res)=>{
    connection.query('select * from users where status = Teacher',(err,result)=>{
        res.render('teacher.ejs', {
            teachers: result
        })
    })
});

router_db.route('/students/:buasri_id')
.get((req,res)=>{
    connection.query('select * from users where buasri_id = ?', req.params.buasri_id,(err,result)=>{
        res.render('students-detailed.ejs', {
            student: result
        })
    }) 
});

router_db.route('/teachers/:buasri_id')
.get((req,res)=>{
    connection.query('select * from users where buasri_id = ?', req.params.buasri_id,(err,result)=>{
        res.render('students-detailed.ejs', {
            teacher: result
        })
    }) 
});

router_db.route('/courses/:subject_code')
.get((req,res)=>{
    connection.query('select * from subject where subject_code = ?', req.params.subject_code,(err,result)=>{
        res.render('course-detailed.ejs', {
            teacher: result
        })
    }) 
});

// add
router_db.route('/add-students')
.get((req,res)=>{
    // res.sendFile(path.join(__dirname, "/public/dbadd.html"));  
})
.post((req, res)=>{
    const student_id = req.body.student_id;
    const buasri_id = req.body.buasri_id;
    const name = req.body.name;
    const lastname = req.body.lastname;
    const major = req.body.major;
    const email = req.body.email;
    const phone = req.body.phone;

    const post = {
        student_id: student_id,
        buasri_id: buasri_id,
        name: name,
        lastname: lastname,
        major: major,
        email: email,
        phone: phone,
        password: student_id,
        status: 'Student'
    };
    connection.query('insert into users set ?', post, (err)=>{
        console.log('Add Student Successfully');
    });
    res.redirect('/students');
});

router_db.route('/add-teachers')
.get((req,res)=>{
    // res.sendFile(path.join(__dirname, "/public/dbadd.html"));  
})
.post((req, res)=>{
    const buasri_id = req.body.buasri_id;
    const name = req.body.name;
    const lastname = req.body.lastname;
    const email = req.body.email;
    const phone = req.body.phone;

    const post = {
        buasri_id: buasri_id,
        name: name,
        lastname: lastname,
        email: email,
        phone: phone,
        status: 'Teacher'
    };
    connection.query('insert into users set ?', post, (err)=>{
        console.log('Add Teacher Successfully');
    });
    res.redirect('/teachers');
});

router_db.route('/add-courses')
.get((req,res)=>{
    // res.sendFile(path.join(__dirname, "/public/dbadd.html"));  
})
.post((req, res)=>{
    const semester = req.body.semester;
    const name = req.body.name;
    const subject_code = req.body.subject_code;
    const section = req.body.section;
    const teacher = req.body.teacher;

    const course = {
        semester: semester,
        name: name,
        subject_code: subject_code,
        section: section,
        teacher: teacher,
    };

    connection.query('insert into subject set ?', course, (err)=>{
        console.log('Add Course Successfully');
    });

    const students = req.body.students // array of student

    students.forEach(element => {
        const enroll = {
            subject_code: subject_code,
            section: section,
            student_code: element,
            attendance_count: 0
        }
        connection.query('insert into enrollment set ?', enroll, (err)=>{
            console.log('Add Enrollment for',element,'Successfully');
        })
    });

    connection.query(
        'select count(student_code) as student_enroll from enrollment where subject_code = ? and section = ?',
        [subject_code, section],
        (err, result)=>{
            connection.query('update subject set student_count = ? where subject_code = ? and section = ?',
            [result.student_enroll,subject_code,section],
            (err)=>{
                console.log('Add No. of Student To Course Successfully');
            });
    })

    res.redirect('/courses');
});

// edit
router_db.route('/edit-students/:buasri_id')
.get((req,res)=>{
    connection.query('select * from users where buasri_id = ?', req.params.buasri_id, (err, result)=>{
        res.render('edit-students.ejs', {
            info: result
        })
    }) 
})
.post((req, res)=>{
    const update_stuID = req.body.student_id;
    const update_buaID = req.body.buasri_id;
    const update_name = req.body.name;
    const update_lastname = req.body.lastname;
    const update_major = req.body.major;
    const update_email = req.body.email;
    const update_phone = req.body.phone;

    const update = {
        student_id: update_stuID,
        buasri_id: update_buaID,
        name: update_name,
        lastname: update_lastname,
        major: update_major,
        email: update_email,
        phone: update_phone,
    }

    connection.query(
        'update users set ? where buasri_id = ?',
        [update, req.params.buasri_id],
        (err, results)=>{
            if (results.changedRows === 1) {
                console.log('Students Updated');
            }
            return res.redirect('/students');
        }
    );
});

router_db.get('/edit-teachers/:buasri_id', (req,res)=>{
    connection.query('select * from users where buasri_id = ?', req.params.buasri_id, (err, result)=>{
        res.render('edit-teachers.ejs', {
            info: result
        })
    })  
})
.post((req, res)=>{
    const update_buaID = req.body.buasri_id;
    const update_name = req.body.name;
    const update_lastname = req.body.lastname;
    const update_email = req.body.email;
    const update_phone = req.body.phone;

    const update = {
        buasri_id: update_buaID,
        name: update_name,
        lastname: update_lastname,
        email: update_email,
        phone: update_phone,
    }

    connection.query(
        'update users set ? where buasri_id = ?',
        [update, req.params.buasri_id],
        (err, results)=>{
            if (results.changedRows === 1) {
                console.log('Teachers Updated');
            }
            return res.redirect('/teachers');
        }
    );
});

router_db.route('/edit-courses/:subject_code-:section')
.get((req,res)=>{
    connection.query('select * from subject where subject_code = ? and section = ?; select * from enrollment where subject_code = ? and section = ?; select count(class_id) as class_count from class where subject_code = ? and section = ?',
    [req.params.subject_code, req.params.section, req.params.subject_code, req.params.section, req.params.subject_code, req.params.section],
    (err, results)=>{
        res.render('edit_course.ejs', {
            courseinfo: results[0],
            students: results[1],
            class: results[2].class_count
        })
    })
})
.post((req,res)=>{
    const semester = req.body.semester;
    const name = req.body.name;
    const subject_code = req.body.subject_code;
    const section = req.body.section;
    const teacher = req.body.teacher;

    const course = {
        semester: semester,
        name: name,
        subject_code: subject_code,
        section: section,
        teacher: teacher,
    };

    connection.query('insert into subject set ?', course, (err)=>{
        // console.log('Add Course Successfully');
    });

    const students = req.body.students // array of student_id

    students.forEach(element => {

        connection.query(
            'select * from enrollment where subject_code = ? and section = ? and student_id = ?',
            [req.params.subject_code, req.params.section, element],
            (err, results)=>{
                if (results.length == 0) {
                    const enroll = {
                        subject_code: subject_code,
                        section: section,
                        student_code: element,
                        attendance_count: 0
                    }
            
                    connection.query('insert into enrollment set ?', enroll, (err)=>{
                        console.log('Add Enrollment for',element,'Successfully');
                    })
                }
            }
        )
    });

    connection.query(
        'select * from enrollment where subject_code = ? and section = ?',
        [req.params.subject_code, req.params.section],
        (err, results)=>{
            students.forEach(element=>{
                if (!results.includes(element)) {
                    connection.query('delete from enrollment where student_id = ?',element,(err)=>{
                        console.log('Delete excess students successfully')
                    })
                }
            })
        })

    connection.query(
        'select count(student_code) as student_enroll from enrollment where subject_code = ? and section = ?',
        [subject_code, section],
        (err, result)=>{
            connection.query('update subject set student_count = ? where subject_code = ? and section = ?',
            [result.student_enroll,subject_code,section],
            (err)=>{
                console.log('Update No. of Student To Course Successfully');
            });
        })

})

// delete
router_db.route('/delete-student/:student_code')
.get((req, res)=>{
    connection.query(
        'delete a.*, b.* from enrollment a, users b where a.student_code = b.student_code and a.student_code = ?',
        req.params.student_code,
        (err)=>{
            console.log('Delete successfully')
        })
    res.redirect('/students')
});

router_db.route('/delete-teacher/:buasri_id')
.get((req, res)=>{
    connection.query(
        'delete a.*, b.*, c.* from enrollment a, subject b, users c where a.subject_code = b.subject_code and b.teacher = c.buasri_id and c.buasri_id = ?',
        [req.params.buasri_id],
        (err, results)=>{
            console.log('Delete successfully')
        }
    );
    res.redirect('/teachers')
});

router_db.route('/delete-course/:subject_code-:section')
.get((req, res)=>{
    connection.query(
        'delete from subject where subject_code = ? and section = ?',
        [req.params.subject_code, req.params.section],
        (err)=>{
            console.log('Delete successfully')
        }
    )
    res.redirect('/courses')
})

module.exports = router_db;