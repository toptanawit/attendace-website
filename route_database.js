var express = require('express');
var path = require('path')
var bodyParser = require('body-parser');
var mysql = require('mysql');
const session = require('express-session');
var router_db = express.Router();
var bcrypt = require('bcryptjs');
const fs = require('fs');
const fileUpload = require("express-fileupload"); 
const e = require('express');
const localStorage = require("localStorage");

router_db.use(bodyParser.urlencoded({ extended: true }));
router_db.use(express.json());
router_db.use( fileUpload({
    createParentPath: true,
}));

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'final',
    multipleStatements: true
});

router_db.use(session({
    secret: 'COSCI', cookie: { maxAge: 60000000 },
    resave: true, saveUninitialized: false
}));

// read
router_db.route('/courses')
.get( function(req, res){
    if (req.session.loggedin != null && req.session.loggedin == true) {
        connection.query('select status from users where buasri_id = ?',req.session.userID,(err,result)=>{
            const status = result[0].status;
            if (status == 'admin') {
                connection.query('select * from subject',(err, result)=>{
                    // for (const index in result) {
                    //     const subject_code = result[index].subject_code;
                    //     const section = result[index].section;
                    //     const student_enroll = result[index].student_count;
                    //     console.log(subject_code,section,student_enroll);
                        // connection.query(
                        //     'select count(c.class_id) as no_of_class , count(a.attendance_id) as no_of_attendance from class c , attendance a where a.subject_code = c.subject_code and c.subject_code = ? and c.`section` = ?',
                        //     [subject_code,section],
                        //     (err,results)=>{
                                res.render('admin/a_all_courses.ejs', {
                                    courses: result,                               
                                })
                            // }
                        // )
                    // }
                });
            } else if (status == 'Teacher') {
                connection.query('select s.* from subject s , users u where s.teacher = u.buasri_id and u.buasri_id = ?',req.session.userID,(err, result)=>{
                    // var attendance_rate = [];

                    // for (const index in result) {
                    //     const subject_code = result[index].subject_code;
                    //     const section = result[index].section;
                    //     const student_enroll = result[index].student_count;
                        // console.log(subject_code,section,student_enroll);
                        // connection.query(
                        //     'select count(c.class_id) as no_of_class , count(a.attendance_id) as no_of_attendance from class c , attendance a where a.subject_code = c.subject_code and c.subject_code = ? and c.`section` = ?',
                        //     [subject_code,section],
                        //     (err,results)=>{
                        //         const no_of_class = results[0].no_of_class;
                        //         const no_of_attendance = results[0].no_of_attendance;
                                // console.log(no_of_class,no_of_attendance);
                                // var rate = (no_of_attendance/(no_of_class*student_enroll))*100;
                                // attendance_rate.push({percent: rate});
                                // console.log(attendance_rate[0]);

                                res.render('teacher/t_all_courses.ejs', {
                                    courses: result,
                                    // attendance_rate: attendance_rate
                                })
                            // }
                        // )
                    // }
                });
            } else if (status == "Student") {
                connection.query('select s.* from subject s , enrollment e where s.subject_code = e.subject_code and e.buasri_id = ?',req.session.userID,(err, result)=>{
                    res.render('student/s_all_courses.ejs', {
                        courses: result
                    })
                });
            }
        })
    }
});

router_db.route('/students')
.get((req,res)=>{
    connection.query('select * from users where status = "Student"',(err,result)=>{
        res.render('admin/a_all_student.ejs', {
            students: result
        })
    }) 
});

router_db.route('/teachers')
.get((req,res)=>{
    connection.query('select * from users where status = "Teacher"',(err,result)=>{
        res.render('admin/a_all_teacher.ejs', {
            teachers: result
        })
    })
});

router_db.route('/students/:buasri_id')
.get((req,res)=>{
    connection.query('select * from users where buasri_id = ?; select a.*, b.* from enrollment a , subject b where a.subject_code = b.subject_code and buasri_id = ?',[req.params.buasri_id,req.params.buasri_id],(err,result)=>{
        res.render('admin/a_details_student.ejs', {
            student: result[0],
            course: result[1]
        })
    }) 
});

router_db.route('/teachers/:buasri_id')
.get((req,res)=>{
    connection.query('select * from users where buasri_id = ?; select * from subject where teacher = ?',[req.params.buasri_id,req.params.buasri_id],(err,result)=>{
        res.render('admin/a_details_teacher.ejs', {
            teacher: result[0],
            course: result[1]
        })
    }) 
});

router_db.route('/courses/:subject_code-:section')
.get((req,res)=>{
    connection.query('select * from subject where subject_code = ? and section = ?', [req.params.subject_code,req.params.section],(err,result)=>{
        const subject = result;
        connection.query('select status from users where buasri_id = ?',req.session.userID,(err,result)=>{
            const status = result[0].status;
            if (status == 'admin') {
                connection.query('select a.*, b.student_id, b.name as firstname, b.lastname, b.major from enrollment a , users b where a.buasri_id = b.buasri_id and a.subject_code = ? and a.section = ?',[req.params.subject_code,req.params.section],(err,result)=>{
                    const student = result;
                    res.render('admin/a_details_course.ejs', {
                        course: subject,
                        student: student
                    })
                })
            } else if (status == 'Teacher') {
                connection.query('select a.*, b.student_id, b.name as firstname, b.lastname, b.major from enrollment a , users b where a.buasri_id = b.buasri_id and a.subject_code = ? and a.section = ?',[req.params.subject_code,req.params.section],(err,result)=>{
                    const student = result;
                    res.render('teacher/t_details_courses.ejs', {
                        course: subject,
                        student: student
                    })
                })
            } else if (status == 'Student') {
                connection.query('select * from attendance where buasri_id = ? and subject_code = ?',[req.session.userID,req.params.subject_code],(err,result)=>{
                    res.render('student/s_details_courses.ejs', {
                        course: subject,
                        attendance: result
                    })
                })
            }
        })
    }) 
});

// add
router_db.route('/add-students')
.get((req,res)=>{
    res.sendFile(path.join(__dirname, "/public/html/admin/a_add_student.html"));  
})
.post((req, res)=>{
    const student_id = req.body.student_id;
    const buasri_id = req.body.buasri_id;
    const name = req.body.name;
    const lastname = req.body.lastname;
    const major = req.body.major;
    const email = req.body.email;
    const phone = req.body.phone;

    bcrypt.genSalt(10, (err, salt)=>{
        bcrypt.hash(student_id, salt, (err, hash)=>{
            const post = {
                student_id: student_id,
                buasri_id: buasri_id,
                name: name,
                lastname: lastname,
                major: major,
                email: email,
                phone: phone,
                password: hash,
                status: 'Student'
            };
            connection.query('insert into users set ?', post, (err)=>{
                console.log('Add Student Successfully');
            });
        })
    })
    
    res.redirect('/students');
});

router_db.route('/add-teachers')
.get((req,res)=>{
    res.sendFile(path.join(__dirname, "/public/html/admin/a_add_teacher.html"));  
})
.post((req, res)=>{
    const buasri_id = req.body.buasri_id;
    const name = req.body.name;
    const lastname = req.body.lastname;
    const email = req.body.email;
    const phone = req.body.phone;

    bcrypt.genSalt(10, (err, salt)=>{
        bcrypt.hash(buasri_id, salt, (err, hash)=>{
            const post = {
                buasri_id: buasri_id,
                name: name,
                lastname: lastname,
                email: email,
                phone: phone,
                password: hash,
                status: 'Teacher'
            };
            connection.query('insert into users set ?', post, (err)=>{
                console.log('Add Teacher Successfully');
            });
        })
    })
    res.redirect('/teachers');
});

router_db.route('/add-courses')
.get((req,res)=>{
    connection.query('select * from users where status = "Student"',(err,result)=>{
        const student = result;
        connection.query('select * from users where status = "Teacher"',(err,result)=>{
            const teacher = result;
            res.render('admin/a_add_course.ejs',{
                student: student,
                teacher: teacher
            })
        })
    })
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

    console.log(course)

    connection.query('insert into subject set ?', course, (err)=>{
        console.log('Add Course Successfully');
    });


    const students = req.body.students // array of student


    console.log(students)

    for (const stu in students) {
        const enroll = {
            subject_code: subject_code,
            section: section,
            buasri_id: students[stu],
            attendance_count: 0
        }
        connection.query('insert into enrollment set ?', enroll, (err)=>{
            console.log('Add Enrollment for',students[stu],'Successfully');
        })
    }

    connection.query(
        'select count(buasri_id) as student_enroll from enrollment where subject_code = ? and section = ?',
        [subject_code, section],
        (err, result)=>{
            connection.query('update subject set student_count = ? where subject_code = ? and section = ?',
            [result[0].student_enroll,subject_code,section],
            (err)=>{
                console.log('Add No. of Student To Course Successfully');
            });
    })

    res.redirect('/courses');
});

router_db.route('/report')
.get((req,res)=>{ 
    connection.query('select status from users where buasri_id = ?', req.session.userID, (err,result)=>{
        const status = result[0].status;
        if (status == 'Student') {
            connection.query('select subject_code from enrollment where buasri_id = ?',req.session.userID, (err,result)=>{
                console.log(result)
                res.render('student/s_leave.ejs',{
                    course_id: result
                });
            })
        } else if (status == 'Teacher') {
            res.redirect('/edit-report');
        }
    })
})
.post((req,res)=>{
    const subject_code = req.body.subject_code;
    const section = req.body.section;
    const type = req.body.type;
    const date = req.body.date;

    if (!req.files) {
        return res.redirect('/error')
    }
    const file = req.files.file;
    const path = __dirname + "/files/" + file.name;

    file.mv(path, (err) => {
        if (err) {
            return res.status(500).send(err);
        }
        return res.redirect('/courses');
    });

    // const pdf = req.files.user-file;
    // const pdf = req.body.file;
    // const base64data = req.body.file;
    // var blob = Buffer.from(base64data,"base64");
    // var blob = Buffer.from(pdf,"base64");

    connection.query('select curtime() as time, curdate() as date',(err,results)=>{
        const time = results[0].time;

        const post = {
            buasri_id: req.session.userID,
            // buasri_id: req.body.buasri_id,
            subject_code: subject_code,
            section: section,
            type: type,
            file: file.name,
            time: time,
            date: date,
            status: 'Pending'
        }

        connection.query('insert into report set ?',post,(err,result)=>{
            console.log('Add report successfully');
        })
    })
});

router_db.route('/add-students-to-course/:subject_code-:section')
.get((req,res)=>{
    connection.query(
        'select * from users where status = "Student" except select b.* from enrollment a, users b where a.buasri_id = b.buasri_id and a.subject_code = ? and a.section = ?',
        [req.params.subject_code,req.params.section],
        (err,result)=>{
            res.render('admin/a_add_student_to_course.ejs',{
                student: result,
                subject_code: req.params.subject_code,
                section: req.params.section
            })
        })
})
.post((req,res)=>{
    const students = req.body.students // array of buasri_id

    for (const stu in students) {
        connection.query(
            'select * from enrollment where subject_code = ? and section = ? and buasri_id = ?',
            [req.body.subject_code, req.body.section, students[stu]],
            (err, result)=>{
                if (result.length == 0) {
                    const enroll = {
                        subject_code: subject_code,
                        section: section,
                        buasri_id: students[stu],
                        attendance_count: 0
                    }
                    connection.query('insert into enrollment set ?', enroll, (err)=>{
                        console.log('Add Enrollment for',students[stu],'Successfully');
                    })
                }
            }
        )
    }

    connection.query(
        'select count(enroll_id) as student_enroll from enrollment where subject_code = ? and section = ?',
        [subject_code, section],
        (err, result)=>{
            console.log(result[0].student_enroll,'enroll')
            connection.query('update subject set student_count = ? where subject_code = ? and section = ?',
            [result[0].student_enroll,subject_code,section],
            (err)=>{
                console.log('Update No. of Student To Course Successfully');
            });
        })
    
    res.redirect(`/edit-courses/${req.params.subject_code}-${req.params.section}`)
})

// edit
router_db.route('/edit-students/:buasri_id')
.get((req,res)=>{
    connection.query('select * from users where buasri_id = ?', req.params.buasri_id, (err, result)=>{
        res.render('admin/a_edit_student.ejs', {
            info: result
        })
    }) 
})
.post((req, res)=>{
    const update_stuID = req.body.student_id;
    const update_name = req.body.name;
    const update_lastname = req.body.lastname;
    const update_major = req.body.major;
    const update_email = req.body.email;
    const update_phone = req.body.phone;

    const update = {
        student_id: update_stuID,
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

router_db.route('/edit-teachers/:buasri_id')
.get((req,res)=>{
    connection.query('select * from users where buasri_id = ?', req.params.buasri_id, (err, result)=>{
        res.render('admin/a_edit_teacher.ejs', {
            info: result
        })
    })  
})
.post((req, res)=>{
    const update_name = req.body.name;
    const update_lastname = req.body.lastname;
    const update_email = req.body.email;
    const update_phone = req.body.phone;

    const update = {
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
    connection.query('select * from subject where subject_code = ? and section = ?; select a.* from users a, enrollment b where a.buasri_id = b.buasri_id and a.status = "Student" and b.subject_code = ? and b.section = ? ; select count(class_id) as class_count from class where subject_code = ? and section = ?',
    [req.params.subject_code, req.params.section, req.params.subject_code, req.params.section, req.params.subject_code, req.params.section],
    (err, results)=>{
        const courseinfo = results;
        connection.query('select * from users where status = "Teacher"',(err,result)=>{
            const teacher = result;
            res.render('admin/a_edit_course.ejs', {
                courseinfo: courseinfo[0],
                students: courseinfo[1],
                class: courseinfo[2].class_count,
                teacher: teacher
            })
        })
    })
})
.post((req,res)=>{
    const semester = req.body.semester;
    const name = req.body.name;
    const subject_code = req.params.subject_code;
    const section = req.body.section;
    const teacher = req.body.teacher;

    const course = {
        semester: semester,
        name: name,
        section: section,
        teacher: teacher,
    };

    connection.query('update subject set ? where subject_code = ?', [course, subject_code], (err)=>{
        console.log('Update Course Successfully');
    });

    // connection.query(
    //     'select * from enrollment where subject_code = ? and section = ?',
    //     [req.body.subject_code, req.body.section],
    //     (err, results)=>{
    //         for (const index in results) {
    //             var flag = false;
    //             var delete_id = '';
    //             for (const stu in students) {
    //                 if (results[index].buasri_id == students[stu]) {
    //                     flag = true;
    //                 }
    //                 delete_id = results[index].buasri_id;
    //             }

    //             if (!flag) {
    //                 connection.query('delete from enrollment where buasri_id = ? and subject_code = ? and section = ?',[delete_id, req.body.subject_code, req.body.section],(err)=>{
    //                     console.log('Delete excess students successfully')
    //                 })
    //             }
    //         }
    //     })
    
    res.redirect('/courses')
})

router_db.route('/edit-report')
.get((req,res)=>{
    connection.query('select status from users where buasri_id = ?', req.session.userID, (err,result)=>{
        const status = result[0].status;
        if (status == 'Teacher') {
            connection.query(
                'select a.*, b.*, c.name as firstname , c.lastname from report a, subject b, users c where a.subject_code = b.subject_code and b.teacher = c.buasri_id and c.buasri_id = ?',
                req.session.userID,
                (err,result)=>{
                    res.render('teacher/t_leave.ejs',{   
                        report: result
                    })
                })
        }
    })
})

router_db.route('/edit-report-status/:report_id-:status')
.get((req,res)=>{
    const report_id = req.params.report_id;
    const status = req.params.status;
    
    connection.query('update report set status = ? where report_id = ?',[status, report_id],(err,result)=>{
        console.log('Update report status successfully')
    })
    
    res.redirect('/report')
})

// delete
router_db.route('/delete-students/:buasri_id')
.get((req, res)=>{
    connection.query('delete from enrollment where buasri_id = ?',req.params.buasri_id,(err)=>{
        connection.query('delete from users where buasri_id = ?',req.params.buasri_id,(err)=>{
            console.log('Delete Successfully');

            connection.query('select subject_code, section from subject',(err, results)=>{
                for (const index in results) {
                    connection.query(
                        'select count(enroll_id) as student_enroll from enrollment where subject_code = ? and section = ?',
                        [results[index].subject_code, results[index].section],
                        (err, result)=>{
                            console.log(result[0].student_enroll,'enroll')
                            connection.query('update subject set student_count = ? where subject_code = ? and section = ?',
                            [result[0].student_enroll,results[index].subject_code,results[index].section],
                            (err)=>{
                                console.log('Update No. of Student To Course Successfully');
                            });
                        })
                }
            })
        })
    })

    res.redirect('/students')
});

router_db.route('/delete-teachers/:buasri_id')
.get((req, res)=>{
    connection.query(
        'delete a.* from enrollment a, subject b where a.subject_code = b.subject_code and b.teacher = ?',
        [req.params.buasri_id],
        (err)=>{
            connection.query('delete from subject where teacher = ?',req.params.buasri_id,(err)=>{
                    connection.query('delete from users where buasri_id = ?',req.params.buasri_id,(err)=>{
                        console.log('Delete Successfully');
                    })
                }
            )
        }
    )

    res.redirect('/teachers')
});

router_db.route('/delete-courses/:subject_code-:section')
.get((req, res)=>{
    connection.query('delete from enrollment where subject_code = ? and section = ?',[req.params.subject_code, req.params.section],(err)=>{
        connection.query('delete from subject where subject_code = ? and section = ?',[req.params.subject_code, req.params.section],(err)=>{
            console.log('Delete Successfully');

            res.redirect('/courses')
        })
    })
})

router_db.route('/delete-students-from-course/:subject_code-:section/:buasri_id')
.get((req,res)=>{
    connection.query(
        'delete from enrollment where buasri_id = ? and subject_code = ? and section = ?',
        [req.params.buasri_id,req.params.subject_code,req.params.section],
        (err,result)=>{
            console.log('Delete student from course successfully')
        })

    connection.query(
        'select count(enroll_id) as student_enroll from enrollment where subject_code = ? and section = ?',
        [req.params.subject_code, req.params.section],
        (err, result)=>{
            console.log(result[0].student_enroll,'enroll')
            connection.query('update subject set student_count = ? where subject_code = ? and section = ?',
            [result[0].student_enroll,req.params.subject_code,req.params.section],
            (err)=>{
                console.log('Update No. of Student To Course Successfully');
            });
        })

    res.redirect(`/edit-courses/${req.params.subject_code}-${req.params.section}`);
})

// attendance check
router_db.route('/attendance')
.get((req,res)=>{
    // upload page
    res.sendFile(path.join(__dirname, "/public/html/student/s_qrcode.html"));  
})
// .post((req,res)=>{
//     const subject_name = req.body.subject_name;
//     const section = req.body.section;
//     const date = req.body.date;
//     const time = req.body.time;
//     const location = req.body.location;

//     const post = {
//         name: subject_name,
//         section: section,
//         time: time,
//         date: date,
//         location: location,
//     }

//     res.render('student/s_attendance.ejs', {
//         info: post
//     })
// })

router_db.route('/attendance-create/:subject_code-:section')
.get((req,res)=>{
    const subject_code = req.params.subject_code;
    const section = req.params.section;
    
    connection.query('select curtime() as time , curdate() as date',(err,results)=>{
        const time = results[0].time;
        const date = formatDate();

        const post = {
            subject_code: subject_code,
            section: section,
            student_count: 0,
            time: time,
            date: date
        }

        connection.query('insert into class set ?',post,(err,result)=>{
            console.log('Class created successfully')
            connection.query('select class_id from class where subject_code = ? and section = ? and date = ?',[subject_code,section,date],(err,result)=>{
                connection.query('select a.*, b.student_count as student_enroll, b.name as subject_name from class a , subject b , attendance c where a.subject_code = b.subject_code and a.class_id = c.class_id and a.class_id = ?',result[0].class_id,(err,result)=>{
                    res.render('teacher/t_qrcode.ejs',{
                        course: result,
                        subject_code: subject_code,
                        section: section
                    })
                })
            })
        })
    })
})

//---------!!!!! TEST POST FROM QRCODE T. PAGE  START !!!! -------- 

//หน้าคิวอาโค้ด teacher
router_db.route('/attendance-create/localstorage')
.post((req, res) => {
    let path_id = req.body.path_id
    localStorage.setItem('path_id', path_id)
    console.log(localStorage.getItem('path_id'))

    // setInterval(() => {
    //     console.log("Clear Storage")
    //     localStorage.clear() //เคลียร์เวลา่อาจารย์กลับหน้าหลัก คือกด submit หน้า qrcode เสร็จปุ๊บเคลียเลย
    // }, 200000);
})

function routeCheck(path_id) {
    //data for testing
    localStorage.setItem('temp', 'temp');
    console.log(path_id)

    //validation
    let id_exists = false;

    //check id is exists or not
    for (const key in localStorage) {
        let value = localStorage.getItem(key);
        if (value != null) {
            console.log(value)
        }
  e                        
        if (path_id == value) {
            id_exists = true;
        }
    }

    console.log("ID Exists", id_exists);

    return id_exists;
}

//set up date
function formatDate() {
    var d = new Date(),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;

    return [year, month, day].join('-');
}

router_db.route('/attendance-check/:subject_code-:section/:time-:path_id')
.get((req, res) => {
    const subject_code = req.params.subject_code;
    const section = req.params.section;
    const date = formatDate();
    const time = req.params.time;
    const path_id = req.params.path_id;


    // ID สำหรับทดสอบ 
    // ID ที่ไม่ได้เก็บ >>>    /attendance-check/SOS101-B01/09:08:55-YGX123
    // ID ที่เก็บ >>>>   /attendance-check/SOS101-B01/09:08:55-temp


    const post = {
        subject_code: subject_code,
        section: section,
        date: date,
        time: time
    }

    if (routeCheck(path_id) == true) {
        console.log("Path is valid");
        res.render('student/s_attendance.ejs', {
            info: post
        })
    } else {
        console.log("Path is not valid");
        res.redirect('/error');
    }
})

//---------!!!!! TEST POST FROM QRCODE T. PAGE END !!!! -------- 

router_db.route('/attendance-check')
.post((req,res)=>{
    const subject_code = req.body.subject_code;
    const section = req.body.section;
    const date = formatDate();
    const time = req.body.time;
    // const location = req.body.location;



    //from input form
    const image = req.body.image;
    var blob = Buffer.from(image,"base64");

    // connection.query('select subject_code from subject where name = ?',name,(err,result)=>{
    //     const subject_code = result[0].subject_code;

        connection.query('select class_id from class where subject_code = ? and section = ? and date = ?',[subject_code,section,date],(err,result)=>{
            const class_id = result[0].class_id;

            const post = {
                subject_code: subject_code,
                buasri_id: req.session.userID,
                // buasri_id: req.body.buasri_id,
                class_id: class_id,
                section: section,
                time: time,
                date: date,
                // location: location,
                image: blob
            }

            connection.query('select * from attendance where buasri_id = ? and subject_code = ? and section = ? and date = ?',[req.session.userID,subject_code,section,date],(err,result)=>{
                if (result.length == 0) {
                    connection.query('insert into attendance set ?',post,(err,result)=>{
                        connection.query('select count(class_id) as student from attendance where class_id = ?',class_id,(err,result)=>{
                            const studentno = result[0].student;
                            connection.query('update class set student_count = ? where class_id = ?',[studentno,class_id],(err,result)=>{
                                console.log('Add attendance successfully')
                                res.redirect('/courses');
                            })
                        })
                    })
                } else {
                    res.redirect('/error')
                }
            })
        })
    // })

    
})

router_db.route('/download/attendance-:attendance_id')
.get((req,res)=>{
    connection.query('select image from attendance where attendance_id = ?',req.params.attendance_id,(err,result)=>{
        const imagebuffer = result[0].image;
        fs.writeFileSync("attendance-image.jpg", imagebuffer);
        res.download('attendance-image.jpg');
    })
})

router_db.route('/download/report-:report_id')
.get((req,res)=>{
    connection.query('select file from report where report_id = ?',req.params.report_id,(err,result)=>{
        // const filebuffer = result[0].file;
        // fs.writeFileSync("report.pdf", filebuffer);
        // res.download('report.pdf');

        const file = `${__dirname}/files/${result[0].file}`;
        res.download(file); 
    })
})

module.exports = router_db;