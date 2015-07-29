from pymongo import MongoClient
from bson.objectid import ObjectId
import logging

logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

client = MongoClient('10.19.0.20', 27017)
db = client.ma

comments = db.comments


def getAllComments(section_id_list):
    # TO DO: implement method
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

def addComment(comment):
    # TO DO: implement method

    logger.info('function addComment() --- Entering')
    logger.debug('Object comment: ' + str(comment))
    sid = comment['sectionId']
    comments.insert_one(comment);
    comment['id'] = comment['_id']

def deleteComment(comment):
    # TO DO: implement method
    comments.remove({"_id": ObjectId(comment['id'])})
