# Copyright (c) Cristian Anastasiu
# Python module which provides methods
# for connecting to the local MongoDB instance
# usint Pymongo
# This module provides the interface for the
# comments MongoDB collection



from pymongo import MongoClient
from bson.objectid import ObjectId
import logging

logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

# Connection to the local MongoDB. The database
# listens only to local connections.
client = MongoClient('localhost', 27017)
db = client.ma

# We choose the comments db
comments = db.comments


# Method for retrieving all the comments from the db
# for a given sectionId
def getAllComments(section_id_list):
    result = list()
    for x in section_id_list:
        d = dict()
        d['sectionId'] = x
        d['comments'] = list()
        for comment in comments.find({"sectionId": x}):
            comment['id'] = comment['_id']
            d['comments'].append(comment)
        result.append(d)
    return result

# Method for adding a comment
def addComment(comment):
    #logger.info('function addComment() --- Entering')
    #logger.debug('Object comment: ' + str(comment))
    sid = comment['sectionId']
    comments.insert_one(comment);
    comment['id'] = comment['_id']

# Method for deleting a comment
def deleteComment(comment):
    comments.remove({"_id": ObjectId(comment['id'])})
