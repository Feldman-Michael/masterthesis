/**
 * Main JS script for the Display Notes component.
 * This module loads the contents of the shared.txt file (shared notes) and
 * displays it as a read-only yellow markdown cell in each project notebook.
 * The component also sets the cell line limit to 50.
 * @author Cristian Anastasiu
 * @module main.js
 */

"use strict";
require(['base/js/utils',
"nbextensions/ma/client/common/js/googledrive/gdapi",
"notebook/js/menubar"
 ], function(utils, gdapi, MenuBar) {

   /*
   IPython.MenuBar.prototype._nbconvert = function (format, download) {
        //console.log(this.notebook);

        download = download || false;
        var notebook_path =  "tmp/" + this.notebook.notebook_path;

        var url = utils.url_join_encode(
            this.base_url,
            'nbconvert',
            format,
            notebook_path
        ) + "?download=" + download.toString() + "&delete=true";

        var gid = this.notebook['metadata']['id'] || Object.keys(this.notebook.contents['_last_observed_revision'])[0]
        gdapi.file_get_content(gid).then(function(body){
          for (x in body.cells){
            body.cells[x].source = ''.join(body.cells[x].source)
          }
          console.log(body);
          $.ajax({
            url: "/nbconvert/" + format,
            contentType: 'application/json,charset=UTF-8',
            type: 'POST',
            data: JSON.stringify({ 'path': notebook_path, 'content': body}),
            dataType: 'html',
            success: function(res){
              console.log(res);
            }
          });
        })

    };
    */

  /* Load the content from file in Google Drive using fileid, set it as content for markdown cell  */
   var set_cell_content = function(varid,cell){
     gdapi.file_get_content(varid).then(function(result){
        cell.set_text(result);
        cell.execute();
        cell.read_only = true;
        var output_area = cell.element.find('div.rendered_html');
        output_area.css("background-color","#F5D76E");
   });
  }

  /* Set cell readonly */ 
   var setReadOnly = function(cell, val) {
     if (typeof val === 'undefined') {
       val = false;
     }
     if (typeof cell.metadata.run_control === 'undefined') {
       cell.metadata.run_control = {};
     }
     cell.metadata.run_control.read_only = val;
     cell.read_only = val;
     var prompt = cell.element.find('div.input_area');
     if (val == true) {
       prompt.css("background-color", "#ffffff");
     } else {
       prompt.css("background-color", "#f5f5f5");
     }
     cell.code_mirror.setOption('readOnly', val);
   };


   /**
     * Parsing all the cells.
     */
   $([IPython.events]).on('notebook_loaded.Notebook', function(){
     var cells = IPython.notebook.get_cells();
     for (var i in cells) {
       var cell = cells[i];

       /* Limit cell size to 50 lines */
       cell.code_mirror.on( "beforeChange",function(cm, change) {

         if (change.text && cm.display.viewTo > 50){
            change.update(change.from, change.to, [change.text.join("") ]);
          }
        });
        /* Check if cell has the variable_cell metadata attribuet, if yes, load notes content*/
       if (cell.metadata.variable_cell){
         set_cell_content(cell.notebook.metadata.variablesid,cell);
       }
     };
   });


});
