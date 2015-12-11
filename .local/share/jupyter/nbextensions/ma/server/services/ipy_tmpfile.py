# Copyright (c) IPython-Contrib Team.
# Notebook Server Extension to activate/deactivate javascript notebook extensions
#
import IPython
from IPython.utils.path import get_ipython_dir
from IPython.html.utils import url_path_join as ujoin
from IPython.html.base.handlers import IPythonHandler, json_errors
import tornado
from tornado import web
import json
import io
import re
import logging
import random
import string
import os
import base64

import logging
logger = logging.getLogger()
logger.setLevel(logging.DEBUG)


class TmpFileHandler(IPythonHandler):
    @web.authenticated
    def post(self):
        payload = tornado.escape.json_decode(self.request.body)
        body = base64.b64decode(payload['body'])
        path = payload['path']
        name = path.split('/')[-1]

        save_path = "/home/ipython/tmp/data/" + '/'.join(path.split('/')[:-1])
        if not os.path.exists(save_path):
            os.makedirs(save_path)
        with open(save_path + "/" + name, "wb") as tmpfile:
            tmpfile.write(body)
        self.set_status(201)
