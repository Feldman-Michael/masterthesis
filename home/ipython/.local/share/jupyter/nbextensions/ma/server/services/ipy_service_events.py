# Copyright (c) Cristian Anastasiu
# Notebook Server Extension which provides the REST services
# for {event} resources
# Extends the Tornado websocket server


import time
import os.path
import urllib
import sys
import tornado

from tornado import web

import random
import json

from server.db import ipy_mongodb_events as ev

import logging
from collections import defaultdict
from tornado.options import options, parse_command_line
from tornado.log import enable_pretty_logging

from bson.objectid import ObjectId
from IPython.html.base.handlers import IPythonHandler, json_errors

from notebook.services.config import ConfigManager
cm = ConfigManager()
nb = cm.get('notebook')


# JSON encoder for objects returned by mongodb
class Encoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        else:
            return obj

# Service endpoints:
#
#    /events/{gid}:
#        POST:
#            description: Add new event for project with gid
#        GET:
#            description: Returns all events for project with gid
#
#    /events/recent/{gid}:
#            GET:
#                description: Retrieve the 10 most recent events for project


class EventHandler(IPythonHandler):
    @web.authenticated
    # Check request origin
    def check_origin(self, origin):
        parsed_origin = urllib.parse.urlparse(origin)
        return parsed_origin.netloc.endswith(nb['ma_server_url']+ ":" + nb['ma_server_port'])

    # GET request
    def get(self,recent=None,gid=None):
        # Check if project is passed
        if gid:
            # If request was for the recent events
            if recent:
                x = dict()
                x['items'] = ev.getLastEvents(gid)
                self.write(json.dumps(x,cls=Encoder))
                self.set_status(200)
            # Get all events
            else:
                x = dict()
                x['items'] = ev.getAllEvents(gid)
                self.write(json.dumps(x,cls=Encoder))
                self.set_status(200)
        else:
            self.set_status(404)

    # POST request
    def post(self):
        # Event JSON payload
        json_data = tornado.escape.json_decode(self.request.body)
        x = dict()
        # Add event to database
        x['event'] = ev.addEvent(json_data)
        # Write reponse back
        self.write(json.dumps(x['event']))
        self.set_status(201)
