"using strict";

/*
* Main Function
*/
require(["nbextensions/gdrive/gapi_utils",
"nbextensions/ma/client/side_comments/side-comments-helper",
"nbextensions/ma/client/side_comments/side-comments-events",
 ], function(gapiutils,helper, nbevents) {

  /*
  * Get user information using the google drive api
  */


  /* Load Side Comments css files */
  helper.load_css('/nbextensions/ma/client/side_comments/themes/default-theme.css');
  helper.load_css('/nbextensions/ma/client/side_comments/side-comments.css');

  /*
  * Initialize the side-comments hooks in the events
  * This is where all the logic is and where we open the websocket connection to the backend.
  */
  nbevents.init();

  /* Disable keyboard manager */
  nbevents.disable_keyboard();



  /* Enable the custom Side Comments cell toolbar */
  var CellToolbar = IPython.CellToolbar;

  /* Executed when we switch to the SideComments cell toolbar */
  var toggle_side_comments =  function(div, cell) {
    var button_container = $(div).attr('id','commentable-container')
    var p1 = $('<p/>').text("Comments: ").addClass('comment-text')
    var p2 = $('<p/>').addClass('commentable-section').addClass('comment-icon').attr('data-section-id',cell.metadata.side_comments.id)

    button_container.append(p2);
    button_container.append(p1);
    console.log(cell);
  };

  /*
  * Register the callback under the name ('side_comments.containers to give the
  * user the ability to use it later
  */
  CellToolbar.register_callback('side_comments.containers', toggle_side_comments);
  CellToolbar.register_preset('Side Comments',['side_comments.containers']);



});
