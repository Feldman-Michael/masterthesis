# Copyright (c) IPython-Contrib Team.
# Notebook Server Extension to activate/deactivate javascript notebook extensions
# Extended by Cristian Anastasiu with custom Ipython handlers
#

import IPython
from IPython.utils.path import get_ipython_dir
from IPython.html.utils import url_path_join as ujoin
from IPython.html.base.handlers import IPythonHandler, json_errors
from tornado import web, options
import os
import yaml
import json
from server.services.ipy_service_side_comments import WebSocketHandler
from server.services.ipy_html_distproject import New_PageHandler
from server.services.ipy_html_distproject import Master_PageHandler
from server.services.ipy_service_distproject import DistProjectHandler
from server.services.ipy_service_steps import StepHandler
from server.services.ipy_service_actions import ActionHandler
from server.services.ipy_service_events import EventHandler
from server.services.ipy_tmpfile import TmpFileHandler

class NBExtensionHandler(IPythonHandler):
    """Render the notebook extension configuration interface."""
    @web.authenticated
    def get(self):
        ipythondir = get_ipython_dir()
        nbextensions = os.path.join(ipythondir,'nbextensions')
        exclude = [ 'mathjax' ]
        yaml_list = []
        # Traverse through nbextension subdirectories to find all yaml files
        for root, dirs, files in os.walk(nbextensions):
            dirs[:] = [d for d in dirs if d not in exclude]
            for f in files:
                if f.endswith('.yaml'):
                    yaml_list.append([ root, f] )

        # Build a list of extensions from YAML file description
        # containing at least the following entries:
        #   Type         - identifier
        #   Name         - unique name of the extension
        #   Description  - short explanation of the extension
        #   Main         - main file that is loaded, typically 'main.js'
        #
        extension_list = []
        for y in yaml_list:
            stream = open(os.path.join(y[0],y[1]), 'r')
            extension = yaml.load(stream)

            if all (k in extension for k in ('Type', 'Compatibility', 'Name', 'Main', 'Description')):
                if not extension['Type'].startswith('IPython Notebook Extension'):
                    continue
                if extension['Compatibility'][0] is not '3':
                    continue
                # generate URL to extension
                idx=y[0].find('nbextensions')
                url = y[0][idx::].replace('\\', '/')
                extension['url'] = url
                extension_list.append(extension)
            stream.close()
        json_list = json.dumps(extension_list)
        self.write(self.render_template('nbextensions.html',
            base_url = self.base_url,
            extension_list = json_list,
            page_title="Notebook Extension Configuration"
            )
        )

def load_jupyter_server_extension(nbapp):
    #options.parse_command_line()
    
    webapp = nbapp.web_app
    base_url = webapp.settings['base_url']
    webapp.add_handlers(".*$", [
        # Page handler for the nbextension page
        (ujoin(base_url, r"/nbextensions/"),
            NBExtensionHandler),
        # Websocked used by Side-Comments notebook extension
        (ujoin(base_url, r"/comments"),
            WebSocketHandler),
        # Page handler for the \new page, responsible for
        # rendering the wizard.
        (ujoin(base_url, r"/new"),
            New_PageHandler),
        # Page handler for the \master page, responsible for
        # rendering the project management page
        (ujoin(base_url, r"/master"),
            Master_PageHandler),

        # Handler for the /distprojects REST service
        (ujoin(base_url, r"/distprojects/(convert)$"),
            DistProjectHandler),
        (ujoin(base_url, r'/distprojects/(?P<prid>[\-0-9A-Za-z]+$)'),
            DistProjectHandler),
        (ujoin(base_url, r'/distprojects'),
            DistProjectHandler),

        # Handler for the /actions REST service
        (ujoin(base_url, r'/actions$'),
            ActionHandler),
        (ujoin(base_url, r'/actions/(?P<category>category)/(?P<cid>[0-9A-Za-z-]+$)'),
            ActionHandler),
        (ujoin(base_url, r'/actions/(?P<tree>tree)$'),
            ActionHandler),
        (ujoin(base_url, r'/actions/(?P<acid>[\-0-9A-Za-z]+$)'),
            ActionHandler),

        # Handler for the /events REST service
        (ujoin(base_url, r'/events'),
            EventHandler),
        (ujoin(base_url, r'/events/(?P<recent>recent/)?(?P<gid>[\-0-9A-Za-z]+$)'),
            EventHandler),

        (ujoin(base_url, r'/tmpfile'),
            TmpFileHandler),
        # Handler for the /steps REST service
        (ujoin(base_url, r'/steps'),
            StepHandler),
        (ujoin(base_url, r'/steps/(?P<sid>[\-0-9A-Za-z]+$)'),
            StepHandler)
    ])
