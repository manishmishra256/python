drop table if exists entries;
create table entries(
	id integer primary key autoincrement,
	title text not null,
	text text not null
);

drop table if exists users;
create table users(
	id integer primary key autoincrement,
	name text not null,
	email text not null,
	username text not null,
	password text not null,
	role text not null
);

drop table if exists bookings;
create table bookings(
	id integer primary key autoincrement,
	userid integer not null,
	store text not null,
	storeaddress text not null,
	status text not null,
	starttime text null,
	timespan text not null,
	services text not null,
	petscount text not null,
	petsdescription text not null,
	rateapplied text not null
)