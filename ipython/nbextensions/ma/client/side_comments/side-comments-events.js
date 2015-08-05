define(['base/js/namespace','base/js/events',
'nbextensions/ma/client/side_comments/side-comments-ws',
'nbextensions/ma/client/side_comments/side-comments-helper',
'exports'], function(IPython, events, ws, helper, exports) {
        var sectionIDs = [];

        /* Disable keyboard_manager events */
        exports.disable_keyboard = function() {

          IPython.keyboard_manager.command_shortcuts = null;

        }



        exports.init = function(){

          /* Catch the edit_mode cell event in order to add a custom metdata with the cell ID when a cell is clicked*/

          events.on('edit_mode.Cell', function (event, nbcell) {
            if (nbcell.cell.metadata.side_comments == undefined) {
              nbcell.cell.metadata.side_comments = {};
              nbcell.cell.metadata.side_comments.id = helper.uniqueid();
              sectionIDs.push(nbcell.cell.metadata.side_comments.id);

              console.log("Cell JSON " + JSON.stringify(nbcell));
              console.log("Cell id is " + nbcell.cell.metadata.side_comments.id);
            }
            else {
              console.log("Cell id is " + nbcell.cell.metadata.side_comments.id);
            }
          });

          /* When deleting a cell, remove the id from the sectionIDs array */
          events.on('delete.Cell', function (event, nbcell) {
            if ( nbcell.cell.metadata.side_comments != undefined) {
              var index = sectionIDs.indexOf(nbcell.cell.metadata.side_comments.id);
              if (index > -1) {
                sectionIDs.splice(index, 1);
              }
              console.log("Removed section id " + nbcell.cell.metadata.side_comments.id + " from array ");
            }
          });

          events.on('preset_activated.CellToolbar',function(preset, obj) {
            console.log("CellToolbar activated");
            console.log(obj);

            if(obj.name == 'Side Comments' && sectionIDs.length > 0){
              //Get all side comments when preset is loaded
              var message = JSON.stringify({action : 'getAll', data: sectionIDs});

              console.log("Getting side comments. Seding request");
              console.log(message);
              ws.ws.send(message)
            }

          });

          events.on('notebook_loaded.Notebook',function() {
            console.log('Entering init_side_comments')

            /* Go through all cells and check if side_comments ID exists*/
            var cells = IPython.notebook.get_cells();
            for(var i in cells){
              var cell = cells[i];
              if ((cell instanceof IPython.CodeCell)) {
                if (cell.metadata.side_comments != undefined) {
                  console.log("Cell id is " + cell.metadata.side_comments.id);
                  var index = sectionIDs.indexOf(cell.metadata.side_comments.id);
                  if (index == -1) {
                    sectionIDs.push(cell.metadata.side_comments.id)
                  }
                }

                else {
                  cell.metadata.side_comments = {};
                  cell.metadata.side_comments.id = helper.uniqueid();
                  sectionIDs.push(cell.metadata.side_comments.id)
                  IPython.notebook.save_checkpoint();
                }
              }

            }

            // Get all side comments when notebook is loaded
            var message = JSON.stringify({action : 'getAll', data: sectionIDs});

            console.log("Getting side comments. Seding request");
            console.log(message);
            ws.ws.send(message)


          });


        };
});
