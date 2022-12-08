# attendace-website

sql create table

create table users (
	buasri_id varchar(11),
	password varchar(100),
	student_id varchar(11),
	name varchar(30),
	lastname varchar(30),
	major varchar(50),
	email varchar(40),
	phone varchar(10),
	status varchar(10),
	primary key (buasri_id)
);

create table subject (
	subject_code varchar(6),
	name varchar(30),
	`section` varchar(3),
	semester varchar(6),
	teacher varchar(11),
	student_count int,
	primary key (subject_code),
	foreign key (teacher) references users(buasri_id)
);

create table class (
	class_id int auto_increment,
	subject_code varchar(6),
	`section` varchar(3),
	student_count int,
	`time` time,
	`date` date,
	primary key (class_id)
);

create table enrollment (
	enroll_id int auto_increment,
	subject_code varchar(6),
	`section` varchar(3),
	buasri_id varchar(11),
	attendance_count int,
	primary key (enroll_id),
	foreign key (subject_code) references subject(subject_code),
	foreign key (buasri_id) references users(buasri_id)
);


create table attendance (
	attendance_id int auto_increment,
	buasri_id varchar(11),
	class_id int,
	subject_code varchar(6),
	`section` varchar(3),
	`time` time,
	`date` date,
	image mediumblob,
	location varchar(100),
	primary key (attendance_id),
	foreign key (buasri_id) references users(buasri_id),
	foreign key (class_id) references class(class_id),
	foreign key (subject_code) references subject(subject_code)
);

create table report (
	report_id int auto_increment,
	subject_code varchar(6),
	`section` varchar(3),
	buasri_id varchar(11),
	`type` varchar(20),
	`time` time,
	`date` date,
	file mediumblob,
	status varchar(20),
	primary key (report_id),
	foreign key (subject_code) references subject(subject_code),
	foreign key (buasri_id) references users(buasri_id)
);