# -*- coding: utf-8 -*-
"""
@author: Anastasiu Cristain

WebSocketHandler

Handler for the web socket which will listen on the /comments uri.
Used for real-time communication in the Side-Comments Notebook extension.
It listens to all open sockets for any incoming message.
Depending on the message type (delete or add a comment), it will perform a
database operation and update all the other socket connections.

"""

import time
import os.path
import urllib
import sys

import tornado.web
import tornado.websocket
import tornado.ioloop

import random
import json

from server.db import ipy_mongodb_side_comments as db
from server.db import ipy_mongodb_events as ev


import logging
from collections import defaultdict
from tornado.options import options, parse_command_line
from tornado.log import enable_pretty_logging

from bson.objectid import ObjectId


GLOBALS={
    'sockets': [],
}

enable_pretty_logging()
logger = logging.getLogger()
logger.setLevel(logging.DEBUG)




class Encoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        else:
            return obj

class WebSocketHandler(tornado.websocket.WebSocketHandler):

    def open(self):
        # Add socket to list of existing sockets
        GLOBALS['sockets'].append(self)

    def on_close(self):
        # Delete socket from list of sockets
        GLOBALS['sockets'].remove(self)

    def check_origin(self, origin):
        parsed_origin = urllib.parse.urlparse(origin)
        # Check that incoming connections are from the Jupyter Notebook url
        return parsed_origin.netloc.endswith("pycard.ifi.uzh.ch:8888")

    def on_message(self, message):
        # Executed each time a message is received

        # First, we parse the JSON message received and look for the action value
        x=json.loads(message)
        if ('action' in x.keys()):
            # If action is 'getAll', we retrieve all comments from the database for the
            # respective section, and write the list back.

            if (x['action'] == 'getAll'):
                logger.info(x['action']  + ' --- request received')
                sections = x['data']
                ret = db.getAllComments(sections)
                x['data'] = ret
                self.write_message(json.dumps(x,cls=Encoder))

            # If action is 'add', add the JSON comment object in the database and write the response
            # back through all the opened sockets. This will update all in real-time all the other
            # connections.
            # This operation also generates an event, which is stored in the db.
            if (x['action'] == 'add'):
                logger.info(x['action']  + ' --- request received')
                comment = x['data']

                db.addComment(comment)

                # Add Event
                evt = dict()
                evt['gid'] = x['gid']
                evt['obj_id'] = x['id']
                evt['obj_type'] = 'comment'
                evt['type'] = 'add'
                evt['obj_value'] = x['data']['comment']
                evt['user'] = x['data']['authorName']
                ev.addEvent(evt);

                # Update all sockets
                for sockets_ in GLOBALS['sockets']:
                    logger.info('Sending back object ' + str(x))
                    sockets_.write_message(json.dumps(x,cls=Encoder))

            if (x['action'] == 'delete'):
                logger.info(x['action']  + ' --- request received')
                comment = x['data']
                db.deleteComment(comment)

                evt = dict()
                evt['gid'] = x['gid']
                evt['obj_id'] = x['id']
                evt['obj_type'] = 'comment'
                evt['type'] = 'delete'
                evt['obj_value'] = x['data']['comment']
                evt['user'] = x['data']['authorName']
                ev.addEvent(evt);

                for sockets_ in GLOBALS['sockets']:
                    sockets_.write_message(json.dumps(x,cls=Encoder))



'''
if __name__ == "__main__":

    application = tornado.web.Application([(r"/comments", WebSocketHandler),], debug=True)
    application.listen(webport)

    tornado.ioloop.IOLoop.instance().start()
'''
