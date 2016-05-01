#--- nbextensions configuration ---
from jupyter_core.paths import jupyter_config_dir, jupyter_data_dir
import os
import sys

sys.path.append(os.path.join(jupyter_data_dir(), 'extensions'))

c = get_config()
c.NotebookApp.extra_template_paths = [os.path.join(jupyter_data_dir(),'templates') ]


#--- nbextensions configuration ---
from jupyter_core.paths import jupyter_config_dir, jupyter_data_dir
#from IPython.utils.path import get_ipython_dir
import os
import sys

sys.path.append(os.path.join(jupyter_data_dir(), 'extensions'))

c = get_config()
#c.NotebookApp.extra_template_paths = [os.path.join(jupyter_data_dir(),'templates') ]
#ipythondir = get_ipython_dir()

ma_extensions = os.path.join(jupyter_data_dir(),'nbextensions/ma')

sys.path.append( ma_extensions )

c.NotebookApp.server_extensions = ['server_extensions']
c.NotebookApp.extra_template_paths = [os.path.join(ma_extensions,'client/html/templates') ]
c.InteractiveShellApp.exec_lines = [ 'import notebook_importing' ]
