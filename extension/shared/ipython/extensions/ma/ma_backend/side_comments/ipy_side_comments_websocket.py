# -*- coding: utf-8 -*-
"""
Created on Tue Apr 09 09:45:06 2013

@author: Juergen Hasch, python@elbonia.de

Distributed under the terms of the BSD License.
"""

"""
Tornado websocket server
Store cell text under unique id in dict
*This is a proof of concept only*

TODO:
    - multiple connects
    - persistent storage
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
from ma.ma_backend.side_comments import ipy_side_comments_mongodb as db

#from zmq.eventloop import ioloop, zmqstream

import logging
from collections import defaultdict
from tornado.options import options, parse_command_line
from tornado.log import enable_pretty_logging

from bson.objectid import ObjectId


#webport = 8889 # port address for web client


GLOBALS={
    'sockets': [],
    'comments': defaultdict(list)
}


HISTORY= {}
POSITION = {}

enable_pretty_logging()
logger = logging.getLogger()
logger.setLevel(logging.DEBUG)
logger.info('Tornado comments started')



class Encoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        else:
            return obj

class WebSocketHandler(tornado.websocket.WebSocketHandler):

    def open(self):
        GLOBALS['sockets'].append(self)

    def on_close(self):
        GLOBALS['sockets'].remove(self)

    def check_origin(self, origin):
        parsed_origin = urllib.parse.urlparse(origin)
        return parsed_origin.netloc.endswith("77.59.137.184:8888")

    def on_message(self, message):
        x=json.loads(message)
        if ('action' in x.keys()):
            if (x['action'] == 'getAll'):
                logger.info(x['action']  + ' --- request received')
                sections = x['data']
                #logger.debug(sections)
                ret = db.getAllComments(sections)
                x['data'] = ret
                self.write_message(json.dumps(x,cls=Encoder))

            if (x['action'] == 'add'):
                logger.info(x['action']  + ' --- request received')
                comment = x['data']
                db.addComment(comment)
                for sockets_ in GLOBALS['sockets']:
                    logger.info('Sending back object ' + str(x))
                    sockets_.write_message(json.dumps(x,cls=Encoder))

            if (x['action'] == 'delete'):
                logger.info(x['action']  + ' --- request received')
                comment = x['data']
                db.deleteComment(comment)
                for sockets_ in GLOBALS['sockets']:
                    sockets_.write_message(json.dumps(x,cls=Encoder))




if __name__ == "__main__":
    #options.log_file_prefix = '/var/www/ipython/logs/tornado_server.log'

    application = tornado.web.Application([(r"/comments", WebSocketHandler),], debug=True)
    application.listen(webport)

    tornado.ioloop.IOLoop.instance().start()
