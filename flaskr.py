# all the imports
import sqlite3
from flask import Flask, request, session, g, redirect, url_for, abort, render_template, flash
from contextlib import closing

#app code
app = Flask(__name__)
app.config.from_pyfile('config.cfg')

@app.route('/init')
def init_db():
	with closing(connect_db()) as db:
		with app.open_resource('schema.sql', mode='r') as f:
			db.cursor().executescript(f.read())
		db.commit()
	return "Db Creation Successful"

def connect_db():
	return sqlite3.connect(app.config['DATABASE'])

#gets called before any request
@app.before_request
def before_request():
	g.db = connect_db()

#gets called after any request is processed 
@app.teardown_request
def teardown_request(exception):
	db = getattr(g, 'db', None)
	if db is not None:
		db.close()

@app.route('/index')
def index():
	if not session.get('logged_in'):
		return redirect(url_for('login'))

	return render_template('index.htm')

@app.route('/')
def show_entries():
	if not session.get('logged_in'):
		return redirect(url_for('login'))
	return render_template('index.htm')

@app.route('/add', methods=['POST'])
def add_entry():
	if not session.get('logged_in'):
		abort(401)
	g.db.execute('insert into entries (title, text) values (?, ?)', 
		[request.form['title'], request.form['text']])
	g.db.commit()
	flash('New entry was successfully posted')
	return redirect(url_for('show_entries')) 

@app.route('/users')
def show_users():
	if not session.get('logged_in'):
		abort(401)
	cur = g.db.execute('select * from users order by username')
	entries = [dict(id = row[0], name = row[1], email = row[2], username = row[3], role = row[5]) for row in cur.fetchall()]
	return render_template('show_users.htm', entries = entries)

@app.route('/add_user', methods=['GET', 'POST'])
def add_user():
	if request.method =='GET':
		return render_template('create_new_user.htm')
	else:
		if not session.get('logged_in'):
			abort(401)
		g.db.execute('insert into users (name, email, username, password, role) values (?, ?, ?, ?, ?)', 
			[request.form['name'], request.form['email'], request.form['username'], request.form['password'], 'admin' ])
		g.db.commit()
		flash('New user was successfully posted')
		return redirect(url_for('show_users')) 

@app.route('/login', methods = ['GET', 'POST'])
def login():
	error = None
	if request.method == 'POST':
		if request.form['username'] != app.config['USERNAME']:
			error = 'Invalid username'
		elif request.form['password']!= app.config['PASSWORD']:
			error = 'Invalid Password'
		else:
			session['logged_in'] = True
			cur = g.db.execute('select id from users where username = ?', [app.config['USERNAME']])
			row = cur.fetchone()
			if row is not None:
				session['logged_in_id'] = row[0] 

			return redirect(url_for('show_entries'))
	return render_template('login.htm', error = error)

@app.route('/logout')
def logout():
	session.pop('logged_in', None)
	session.pop('logged_in_id', None)
	flash('You were logged out')
	return redirect(url_for('login'))

@app.route('/map')
def lap():
	if not session.get('logged_in'):
		abort(401)

	return render_template('map.htm')	

@app.route('/search')
def search():
	if not session.get('logged_in'):
		redirect(url_for('login'))
	return render_template('map.htm')

@app.route('/subscribe', methods=['POST'])
def subscribeTemplate():
	if not session.get('logged_in'):
		abort(401)
	return render_template('subscribe.htm');

@app.route('/bookings')
def bookings():
		if not session.get('logged_in'):
			return redirect(url_for('login'))

		cur = g.db.execute('select * from bookings where userid = ?', [1])
		entries = [dict(id = row[0], userid = row[1], store=row[2],storeaddress=row[3], status = row[4], starttime = row[5], timespan = row[6], services=row[7], petscount=row[8], petsdescription=row[9], rateapplied=row[10]) for row in cur.fetchall()]
		return render_template('bookings.htm', entries = entries)

@app.route('/addbooking', methods=['POST'])
def addbooking():
	if not session.get('logged_in'):
		abort(401)

	g.db.execute('insert into bookings (userid, store, storeaddress, status, timespan, services, petscount, petsdescription, rateapplied) values (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
		[1, 
		request.json['store'],
		request.json['storeaddress'],
		request.json['status'],
		request.json['timespan'],
		request.json['services'],
		request.json['petscount'],
		request.json['petsdescription'],
		2
		])
	
	g.db.commit()
	return "Booking done successfully.." 	


if __name__ == '__main__':
	app.run()