from flask import *
from flask_pymongo import PyMongo
import os

app = Flask(__name__)
app.config['MONGO_URI'] = os.environ['MONGO_URI']
app.config['NAME'] = os.environ['NAME']
app.config['MODULES'] = os.environ['MODULES']
app.config['BASE_URL'] = os.environ['BASE_URL']

mongo = PyMongo(app)

#api_wol
@app.route('/api/wol/weeks', methods=['GET'])
def get_weeks():
    name = app.config['NAME']
    user_data = mongo.db.people.find_one({'name': name})
    user_data.weekInfo = mongo.db.weeks.find({'name': name}).sort('weekNum', 1)
    return make_response(jsonify(user_data), 200)

@app.route('/api/wol/weeks', methods=['POST'])
def save_week():
    body = request.get_json()
    db.weeks.find_one_and_replace({'weekNum': body.weekNum}, body, upsert=True)
    return 'OK', 200

#api_money
@app.route('/api/money/rates', methods=['GET'])
def get_rates():
    return []

@app.route('/api/money', methods=['GET'])
def get_money():
