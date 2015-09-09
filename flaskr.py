# all the imports
import sqlite3
from flask import Flask, request, session, g, redirect, url_for, abort, render_template, flash
from contextlib import closing

#configuration
DATABASE = 'C:/wamp/www/Projects/python/flaskr/tmp/flaskr.db'
DEBUG = True
SECRET_KEY = 'development key'
USERNAME = 'admin'
PASSWORD = 'default'

#app code
app = Flask(__name__)
app.config.from_object(__name__)

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


@app.route('/')
def show_entries():
	cur = g.db.execute('select title, text from entries order by id desc')
	entries = [dict(title=row[0], text=row[1]) for row in cur.fetchall()]
	return render_template('show_entries.htm', entries = entries)

@app.route('/add', methods=['POST'])
def add_entry():
	if not session.get('logged_in'):
		abort(401)
	g.db.execute('insert into entries (title, text) values (?, ?)', 
		[request.form['title'], request.form['text']])
	g.db.commit()
	flash('New entry was successfully posted')
	return redirect(url_for('show_entries')) 


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
			flash('you are logged in')
			return redirect(url_for('show_entries'))
	return render_template('login.htm', error = error)

@app.route('/logout')
def logout():
	session.pop('logged_in', None)
	flash('You were logged out')
	return redirect(url_for('show_entries'))


if __name__ == '__main__':
	app.run()
