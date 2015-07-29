define(['exports','nbextensions/gdrive/drive_utils','nbextensions/gdrive/gapi_utils'], function(exports,driveutils,gapiutils) {
  var websocket = new WebSocket("ws://77.59.137.184:8888/comments");

  $("body").append($("<script src='/nbextensions/ma/side_comments/side-comments.js'></script>"));

  var SideComments = requiresc('side-comments');

  var currentUser = {
    id: 1,
    avatarUrl: "",
    name: "Anonymous"
  };

  var uready = gapiutils.gapi_ready.then(function () {
    var request = gapi.client.drive.about.get();
    var userName = "Anonymous";
    var pictureUrl = "https://cdn2.iconfinder.com/data/icons/windows-8-metro-style/256/guest.png";

    gapiutils.execute(request).then(function (result) {
      userEmailAddress = result.user.emailAddress;
      userName = result.user.displayName;
      permissionId = result.user.permissionId;
      if(result.user.picture) {
        pictureUrl = result.user.picture.url;
      }
      currentUser.id = userEmailAddress;
      currentUser.avatarUrl = pictureUrl;
      currentUser.name = userName;
      if(sideComments){
        sideComments.setCurrentUser(currentUser);
      }

      console.log("GAPI ready, user information for " + user + " retrieved");

    });

  });




  var updateComments = function(evt) {
    var result = $.parseJSON(evt.data);
    console.log("Returned "+result.action);
    console.log(result)

    if(result.action == 'add'){
      sideComments.insertComment(result.data);
    }
    if(result.action == 'delete'){
      sideComments.removeComment(result.data.sectionId, result.data._id);
    }
    if(result.action == 'getAll'){
      //sideComments.destroy();
      sideComments = new SideComments($("#notebook-container"), currentUser, result.data);
      sideComments.on('commentPosted', function( comment ) {
        //comment.id = uniqueid();
        var message = {action : 'add', data : comment};
        //console.log(message);
        var str = JSON.stringify(message);
        websocket.send(str)
      });

      // Listen to "commentDeleted" and send a request to your backend to delete the comment.
      // More about this event in the "docs" section.
      sideComments.on('commentDeleted', function( comment ) {
        var message = {action : 'delete', data : comment};
        //console.log(message);
        var str = JSON.stringify(message);
        websocket.send(str)
      });
    }
  };

  websocket.onmessage = updateComments;

  exports.ws = websocket;


});
