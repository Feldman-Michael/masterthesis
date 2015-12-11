# Copyright (c) Cristian Anastasiu
# Python module which provides methods
# for connecting to the local MongoDB instance
# usint Pymongo
# This module provides the interface for the
# events MongoDB collection


from pymongo import MongoClient,DESCENDING
from bson.objectid import ObjectId
from datetime import datetime, timezone
import time
import logging
from math import ceil

client = MongoClient('localhost', 27017)
db = client.ma
ev = db.events
dp = db.distprojects

logger = logging.getLogger()


# Example of event dict
# {
#     "gid": "0B79xfDa9qVy1eExiNTNfYzVPdE0", - Project gid
#     "user": "John Smith",
#     "_id": "5651b01e70ffb76049237bb1",
#     "time": 347, -  How many minutes passed after it was generated
#     "obj_name": "", - Name of object, e.g. notebook name
#     "type": "save", - Event type, can be add/delete/update/save/merge
#     "obj_value": "", - Event object value, e.g. comment text
#     "obj_type": "notebook" - Event object type, can be comment/notebook/project
# }
#

# Method for adding event to database
# param - event dict
def addEvent(evt):
    # Insert event into db
    ret = ev.insert_one(evt);
    result = dict()
    result = str(ret.inserted_id)
    # Get creation time of event from ObjectId
    d = ObjectId(result).generation_time
    # Update the projects last_modified_date with the creation time of the event
    dp.update({'gid':evt['gid']}, {"$set": {'last_modified_date': d}}, upsert=False)
    return result

# Method for retrieving all events for a given project id
def getAllEvents(gid):
    result = list()
    # Find all events in db which belong to project with given id
    for p in ev.find({'gid':gid}).sort('_id',DESCENDING):
        d1_ts = datetime.now(timezone.utc)
        d2_ts = p['_id'].generation_time
        # Calculate the time passed since it was created
        p['time'] = ceil((d1_ts-d2_ts).seconds / 60)
        # Return the _id as String and not as ObjectId
        p['_id'] = str(p['_id'])
        result.append(p)
    return result


# Method for retrieving the last 10 events for a given project id
def getLastEvents(gid):
    result = list()
    # Find last 10 events in db which belong to project with given id
    for p in ev.find({'gid':gid}).sort('_id',DESCENDING).limit(10):
        d1_ts = datetime.now(timezone.utc)
        # Calculate the time passed since it was created
        d2_ts = p['_id'].generation_time
        p['time'] = ceil((d1_ts-d2_ts).seconds / 60)
        # Return the _id as String and not as ObjectId
        p['_id'] = str(p['_id'])
        result.append(p)
    return result
