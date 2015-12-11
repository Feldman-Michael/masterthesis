# Copyright (c) Cristian Anastasiu
# Notebook Server Extension to provide two web handlers which will
# render the /new and /master custom web pages.
# Extends the Tornado websocket server
#

import IPython
from IPython.utils.path import get_ipython_dir
from IPython.html.utils import url_path_join as ujoin
from IPython.html.base.handlers import IPythonHandler, json_errors
from tornado import web
import json


# Handler for the /new page. Will render page using the
# wizard.html page
class New_PageHandler(IPythonHandler):
    """Render the create distributed project interface  """
    @web.authenticated
    def get(self):
        self.write(self.render_template('wizard.html',
            base_url = self.base_url,
            page_title="New Distributed Project"
            )
        )

# Handler for the /master page. Will render page using the
# master.html page
class Master_PageHandler(IPythonHandler):
    """Render the create distributed project interface  """
    @web.authenticated
    def get(self):
        self.write(self.render_template('master.html',
            base_url = self.base_url,
            page_title="Manage Distributed Projects"
            )
        )
