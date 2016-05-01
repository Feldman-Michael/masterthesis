"use strict";
require([
  "nbextensions/ma/client/common/js/helper",
  "nbextensions/ma/client/common/js/googledrive/gdapi",
  'services/config',
  'base/js/utils'
], function(helper, gdapi, configmod, utils) {

  var SERVER_URL = 'pycard.ifi.uzh.ch:8888'

  /*
   * Get user information using the google drive api
   */


  /* Load Side Comments css files */
  helper.load_css('/nbextensions/ma/client/common/js/side-comments/themes/default-theme.css');
  helper.load_css('/nbextensions/ma/client/common/js/side-comments/side-comments.css');
  $("body").append($("<script src='/nbextensions/ma/client/common/js/side-comments/side-comments.js'></script>"));



  /* Enable the custom Side Comments cell toolbar */
  var CellToolbar = IPython.CellToolbar;

  /* Executed when we switch to the SideComments cell toolbar */
  var toggle_side_comments = function(div, cell) {
    if (cell.metadata['side_comments']) {
      var button_container = $(div).attr('id', 'commentable-container');
      var p1 = $('<p/>').text("Comments: ").addClass('comment-text');
      var p2 = $('<p/>').addClass('commentable-section').addClass('comment-icon').attr('data-section-id', cell.metadata['side_comments']['id']);
      button_container.append(p2);
      button_container.append(p1);
    }

  };

  /*
   * Register the callback under the name ('side_comments.containers to give the
   * user the ability to use it later
   */
  CellToolbar.register_callback('side_comments.containers', toggle_side_comments);
  CellToolbar.register_preset('Side Comments', ['side_comments.containers']);



  var sectionIDs = [];
  var sideComments;



  var websocket = new WebSocket("ws://"+SERVER_URL+"/comments");
  var SideComments = requiresc('side-comments');

  /*
  ----------------------------------------------------------------------------------------
  Hooking into IPython Events
  ----------------------------------------------------------------------------------------
  */

  $([IPython.events]).on('notebook_loaded.Notebook', function() {
    console.log('ENTERING init_side_comments');

    /* Go through all cells and check if side_comments ID exists*/
    var cells = IPython.notebook.get_cells();

    for (var i in cells) {
      var cell = cells[i];
      if ((cell instanceof IPython.CodeCell)) {
        if (typeof cell.metadata.side_comments != 'undefined') {
          console.log("Cell id is " + cell.metadata.side_comments.id);
          var index = sectionIDs.indexOf(cell.metadata.side_comments.id);
          if (index == -1) {
            sectionIDs.push(cell.metadata.side_comments.id);
          }
        } else {
          cell.metadata.side_comments = {};
          cell.metadata.side_comments.id = helper.uniqueid();
          sectionIDs.push(cell.metadata.side_comments.id);
          IPython.notebook.save_checkpoint();
        }
      }

    }

    var message = JSON.stringify({
      action: 'getAll',
      data: sectionIDs
    });

    console.log("Notebook loaded. Getting ALL side comments. Seding request");
    //console.log('websocket.readyState ' + websocket.readyState);
    if(websocket.readyState == 1){
      websocket.send(message);
    }
    else{
      websocket.onopen = function(evt){
        websocket.send(message);
      };
    }

  });
  /* Catch the edit_mode cell event in order to add a custom metdata with the cell ID when a cell is clicked*/

  $([IPython.events]).on('edit_mode.Cell', function(event, nbcell) {
    if (typeof nbcell.cell.metadata.side_comments === 'undefined') {
      nbcell.cell.metadata.side_comments = {};
      nbcell.cell.metadata.side_comments.id = helper.uniqueid();
      sectionIDs.push(nbcell.cell.metadata.side_comments.id);

      //console.log("Cell JSON " + JSON.stringify(nbcell));
      console.log("Cell id is " + nbcell.cell.metadata.side_comments.id);
    } else {
      console.log("Cell id is " + nbcell.cell.metadata.side_comments.id);
    }
  });

  /* When deleting a cell, remove the id from the sectionIDs array */
  $([IPython.events]).on('delete.Cell', function(event, nbcell) {
    if (typeof nbcell.cell.metadata.side_comments != 'undefined') {
      var index = sectionIDs.indexOf(nbcell.cell.metadata.side_comments.id);
      if (index > -1) {
        sectionIDs.splice(index, 1);
      }
      console.log("Removed section id " + nbcell.cell.metadata.side_comments.id + " from array ");
    }
  });

  $([IPython.events]).on('preset_activated.CellToolbar', function(preset, obj) {
    console.log("CellToolbar activated");
    console.log(sectionIDs);
    if (obj.name == 'Side Comments' && sectionIDs.length > 0) {
      //Get all side comments when preset is loaded
      var message = JSON.stringify({
        action: 'getAll',
        data: sectionIDs
      });

      console.log("Getting ALL side comments. Seding request");

      websocket.send(message);
    }

  });

  $([IPython.events]).on('notebook_saved.Notebook', function() {
    var e = {
      "gid": IPython.notebook.metadata.pgid,
      "type": "save",
      "obj_type": "notebook",
      "obj_id": IPython.notebook.metadata.id,
      "obj_name": '',
      "obj_value": '',
      "user": gdapi.getCurrentUser().name
    };

    helper.addEvent(e);
  });


  /* Disable keyboard manager */
  IPython.keyboard_manager.command_shortcuts = function() {};

  websocket.onmessage = function(evt) {
    var result = $.parseJSON(evt.data);
    console.log("Returned " + result.action);

    if (result.action == 'add') {
      sideComments.insertComment(result.data);
    }
    if (result.action == 'delete') {
      sideComments.removeComment(result.data.sectionId, result.data._id);
    }
    if (result.action == 'getAll') {

      sideComments = new SideComments($("#notebook-container"), gdapi.getCurrentUser(), result.data);
      sideComments.on('commentPosted', function(comment) {

        var message = {
          action: 'add',
          data: comment,
          gid: IPython.notebook.metadata.pgid,
          id: IPython.notebook.metadata.id
        };
        console.log(message);
        var str = JSON.stringify(message);
        websocket.send(str)
      });

      // Listen to "commentDeleted" and send a request to your backend to delete the comment.
      // More about this event in the "docs" section.
      sideComments.on('commentDeleted', function(comment) {
        var message = {
          action: 'delete',
          data: comment,
          gid: IPython.notebook.metadata.pgid,
          id: IPython.notebook.metadata.id
        };
        //console.log(message);
        var str = JSON.stringify(message);
        websocket.send(str)
      });
    }
  };

});
