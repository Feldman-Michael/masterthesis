/**
 * Gdapi Module is a wrapper around specific Google Drive REST APIs.
 * Following methods and variables are being exported
 * {Function} getCurrentUser
 * {Function} init
 * {Function} authorize
 * {Function} file_exists
 * {Function} file_create
 * {Function} file_create_if_not_exists
 * {Function} file_insert
 * {Function} file_inserPermission
 * {Function} file_delete
 * {Function} file_get_notebook
 * {Function} file_get_content
 * {Function} generage_ids
 *
 * For a full specification of the Google Drive REST API's please visit https://developers.google.com/drive/v2/reference/
 * @module gdapi
 * @author Cristian Anastasiu
 */


define(
  [
    "require",
    "exports",
    'jquery',
    'base/js/utils'
  ],
  function(require, exports, $, utils) {

    /**
      * CLIENT_ID. This is the client ID defined in the Google API console
      * which enables REST calls from this domain.
      *
      * @property CLIENT_ID
      * @type {String}
      */
    var CLIENT_ID = '776637753772-e63kc1c3hpr0vfec424jg1sp44p6fgnm.apps.googleusercontent.com';


    /**
      * SCOPES. Google scopes where the authentication token can be used.
      * We use it in our project the complete Google Drive scope.
      *
      * @property SCOPES
      * @type {Array}
      */
    var SCOPES = [
      'https://www.googleapis.com/auth/drive'
      // Add other scopes needed by your application.
    ];


    /**
      * Helper method for doing recursive polling at a certain interval
      * until the condition is met.
      * @method methodName
      * @param {Function} condition A function which defines the condition until the polling will made.
      * @param {Integer} interval Interval which defines how long to wait until to check the condition again.
      * @return {Promise} Returns a Promise object
      */
    var poll = function (condition, interval) {
        return new Promise(function (resolve, reject) {
            var polling_function = function () {
                if (condition()) {
                    resolve();
                }
                else {
                    setTimeout(polling_function, interval);
                }
            };
            polling_function();
        });
    };

    /**
      * Method for loading Google javascript client script.
      * Function is defined asynchronous as a Promise. It loads the google script and then checks
      * every 100ms of the script was loaded and the gapi.client variable is present.
      * @return {Promise} Returns a Promise object
      */
    var load_gscript = function () {
      console.log('Loading Script');
      return Promise.resolve($.getScript('https://apis.google.com/js/client.js')).then(function () {
            // poll every 100ms until window.gapi and gapi.client exist.
            return poll(function () {
                return !!(window.gapi && gapi.client);
            }, 100);
        }, function(err){
          console.log(err);
        });
    };

    /**
      * Method for loading Google Drive client.
      * @return {Promise} Returns a Promise object
      */
    var load_gd_client = function () {
      return new Promise(function (resolve, reject) {
          console.log('Loading Google Client');
          gapi.load('auth:client,drive-realtime,drive-share,picker', function () {
              gapi.client.load('drive', 'v2', resolve('Google API loaded'));
          });
      });
    };


    /**
      * Method returning infmation about current logged in user
      * This information is retrieved after authenticating the user with Google
      * Object has following attributes:
      * * id - this is the Google Email adress
      * * avatarUrl - url to the avatar picture
      * * name - human readable name
      * @exports {Object} currentUser - Returns the user object
      */
    var currentUser = {};

    exports.getCurrentUser = function(){
      return currentUser;
    };

    /**
      * Method for setting the currentUser object
      * This method makes a REST call to the Google Drive api and retrieves the
      * properties of the current user.
      * User needs to be authenticated for the request to work
      * @return {Promise} Returns a Promise object
      */

    var setCurrentUser = function() {
      return new Promise(function (resolve, reject){
        console.log('Setting current user');
        var request = gapi.client.request({
          'path': '/drive/v2/about',
          'method': 'GET'
        });
        var userName = "Anonymous";
        var pictureUrl = "https://cdn2.iconfinder.com/data/icons/windows-8-metro-style/256/guest.png";
        request.execute(function(result) {
          if(!result.error){
            userEmailAddress = result.user.emailAddress;
            userName = result.user.displayName;
            permissionId = result.user.permissionId;
            if (result.user.picture) {
              pictureUrl = result.user.picture.url;
            }
            currentUser.id = userEmailAddress;
            currentUser.avatarUrl = pictureUrl;
            currentUser.name = userName;
            console.log("GAPI ready, user information for " + currentUser.name + " retrieved");
            resolve(currentUser);
          }
          else{
            reject(result.error);
          }
        });
      });

    }

    /**
      * Method for authorizing the Google Drive client.
      * This method authorises the user against the Google for the defined scopes.
      * If user hasn't given its permission yet for the defined scopes, a popup
      * will ask the user for permission to access the content in his Google Drive.
      * @return {Promise} Returns a Promise object
      */
    exports.authorize = function(){
      return new Promise(function (resolve, reject){
          console.log('Authorizing for Google Drive');
          gapi.auth.authorize({'client_id': CLIENT_ID, 'scope': SCOPES.join(' '), 'immediate': true}).then(
              resolve,
              function(err) {
                  console.log('Trying again authorizing for Google Drive');
                  gapi.auth.authorize({'client_id': CLIENT_ID, 'scope': SCOPES.join(' '), 'immediate': false}, resolve);
              }
          );
      });

    };


    /**
      * Helper method to load the Google script first, if succeeded will load the Google Drive client
      */

    var load_gdapi = load_gscript().then(load_gd_client);

    /** Heper method which can be called externally which first loads the Google script and client,
      * then performs authorization and sets the current user information.
      * @exports {init}
      * @return {Promise} Returns a Promise object
      */
    exports.init = Promise.all([load_gdapi]).then(exports.authorize).then(setCurrentUser);


    /**
      * Wrapper method that checks if a file or folder exists in a specific location (parent).
      * Method doesn't look in the Google trash folder.
      * Matching is done by the file/folder title.
      * @method file_exists
      * @param {String} title Title of the file or folder
      * @param {String} parent Google ID of the parent folder
      * @param {String} type item type - file / folder
      * @return {Promise} Returns a Promise object, resolve contains the Google ID of the file/folder
      * if the item exits
      */

    exports.file_exists = function(title, parent, type) {
      return new Promise(function (resolve, reject){
        var request = gapi.client.drive.children.list({
          'folderId' : parent,
          'q': "title = '"+title+"' and '"+parent+"' in parents and mimeType = '"+ type +"' and trashed != true"
        });
        request.execute(function(resp) {
          if (!resp.error) {
            if( !!(resp.items) && resp.items.length > 0){
              console.log(title+' exists in folder '+parent+'.');
              resolve(resp.items[0].id);
            }
            else {
              console.log(title+' does not exist in folder '+ parent +'.');
              resolve(false);
            }
          }
          else {
            console.log(resp.error.code + ' ' + resp.error.message + ' at given URL. Parameters in the url are incorrect or do not exist.');
            reject(resp.error.code + ' ' + resp.error.message);
          }

        });
      });
    };


    /**
      * Wrapper method that that creates a file of a certain type in a specified location (parent).
      * Google ID that the file will get is retrieved by an earlier request.
      * @method file_create
      * @param {String} title Title of the file or folder
      * @param {String} parent Google ID of the parent folder
      * @param {String} type item type - file / folder
      * @param {String} gid Google ID which file will get after being created.
      * This id is generated upfront by another call to Google.
      * @return {Promise} Returns a Promise object, resolve contains the Google ID of the file/folder
      * if the item exits
      */
    exports.file_create = function(title, parent, type, gid) {

      // GET https://www.googleapis.com/drive/v2/files/generateIds
      return new Promise(function (resolve, reject){
        request = gapi.client.drive.files.insert({
          'resource': {
            'title': title,
            'mimeType': type,
            'id': gid,
            'parents' : [{id: parent} ]
           }
        });
        request.execute(function(result){
          if(!result.error && result.id){
            console.log(result.title + ' created in folder '+parent+'.');
            resolve(result.id);
          }
          else{
            reject(result.error);
          }
        });
      });
    };


    /**
      * Wrapper method that checks if a file/folder exists, if not it creates it in the specified parent
      * location.
      * @method file_create_if_not_exists
      * @param {String} title Title of the file or folder
      * @param {String} parent Google ID of the parent folder
      * @param {String} type item type - file / folder
      * @param {String} gid Google ID which file will get after being created.
      * This id is generated upfront by another call to Google.
      * @return {Promise} Returns a Promise object
      */
    exports.file_create_if_not_exists = function(title,parent,type,gid){
      return new Promise(function (resolve, reject) {
        exports.file_exists(title,parent,type).then(function(res){
          if(!res){
            exports.file_create(title,parent,type, gid).then(
              function(val){
                resolve(val);
              }, reject);
          }
          else{
              resolve(res);
          }
        }, reject);
      });
    };


    /**
      * Wrapper method  that uploads a file in a specified location (parentId)
      * location. First part of method checks if the file already exists. If the response
      * is negative, it will upload the file (POST), otherwise it will updat it (PUT)
      * @method file_insert
      * @param {String} fileData Content of file
      * @param {String} filename Title of the file or folder
      * @param {String} parentId Google ID of the parent folder
      * @param {String} mimeType - MIME type of the file content
      * @param {String} gid Google ID which file will get after being created.
      * This id is generated upfront by another call to Google.
      * @return {Promise} Returns a Promise object, resolve contains the file resource object
      */

    exports.file_insert = function(fileData, filename, parentId, gid, mimeType) {

      return new Promise(function (resolve, reject){
        //console.log("Entering function insertFile");
        var contentType = mimeType || fileData.type || 'application/octet-stream';

        exports.file_exists(filename,parentId,contentType).then(function(res){
            var boundary = '-------314159265358979323846';
            var delimiter = "\r\n--" + boundary + "\r\n";
            var close_delim = "\r\n--" + boundary + "--";

            var metadata = {
                'title': filename,
                'mimeType': contentType,
                "parents": [{"id":parentId}],
                "id": gid
            };
            var base64Data;
            try{
              base64Data = btoa(unescape(encodeURIComponent(fileData)));
            }
            catch(e){
              return reject('Could not convert file '+ filename + ' contents to base64. ' + e.message);
            }

            var multipartRequestBody =
                delimiter +
                'Content-Type: application/json\r\n\r\n' +
                JSON.stringify(metadata) +
                delimiter +
                'Content-Type: ' + contentType + '\r\n' +
                'Content-Transfer-Encoding: base64\r\n' +
                '\r\n' +
                base64Data +
                close_delim;

            if(!res){
              var request = gapi.client.request({
                  'path': '/upload/drive/v2/files',
                  'method': 'POST',
                  'params': {'uploadType': 'multipart'},
                  'headers': {
                      'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
                  },
                  'body': multipartRequestBody});

                  request.then(function(file){
                    if (!file.error) {
                      console.log('File ' + file.result.title + ' inserted in parent ' + parentId);
                      resolve(file.result);
                    }
                    else {
                      reject(file.error);
                    }
                  },function(reason){
                      console.log('Error occured ' + JSON.stringify(reason.body));
                      reject(reason);
                  });
            }
            else {
              var request = gapi.client.request({
                'path': '/upload/drive/v2/files/' + res,
                'method': 'PUT',
                'params': {'uploadType': 'multipart', 'alt': 'json'},
                'headers': {
                  'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
                },
                'body': multipartRequestBody});
                request.then(function(file){
                  if (!file.error) {
                    console.log('File ' + file.result.title + ' updated in parent ' + parentId);
                    resolve(file.result);
                  }
                  else {
                    reject(file.error);
                  }
                },function(reason){
                    console.log('Error occured ' + JSON.stringify(reason.body));
                    reject(reason);
                });
            }

        }, reject);
      });
    };


    /**
      * Wrapper method that add permissions to a specific file in Google Drive.
      * @method file_inserPermission
      * @param {String} fileId Google ID of the file
      * @param {String} value  Google user id/ email for the user who will receive the permission
      * @param {String} type User or Group permission
      * @param {String} role Role that the user/group will get - writer/reader
      * @param {Boolean} sendMessage - boolean value if email notification is sent or not
      * @param {String} msg - Email message as text string
      * @return {Promise} Returns a Promise object, resolve contains the permission resource object
      */

    exports.file_inserPermission = function(fileId, value, type, role, sendMessage ,msg) {
      //console.log('Entering function file_insertPermission');
      return new Promise(function (resolve, reject){
        var body = {
          'value': value,
          'type': type,
          'role': role
        };
        var request = gapi.client.drive.permissions.insert({
          'fileId': fileId,
          'sendNotificationEmails' : sendMessage || false,
          'emailMessage': msg || '',
          'resource': body
        });
        request.execute(function(result){
          if(!result.error && result.kind){
              console.log('Permission "'+role+'" for '+value+' added.');
              resolve(result);
          }
          else{
            reject(result.error);
          }
        });
      });
    };




    /**
      * Wrapper method that deletes a specifid file/folder by ID
      * @method file_delete
      * @param {String} fileId Google ID of the file
      * @return {Promise} Returns a Promise object, resolve contains the permission resource object
      */

    exports.file_delete = function(fileId){
      return new Promise(function(resolve,reject){
          var request = gapi.client.drive.files.delete({
            'fileId': fileId
          });
          request.execute(function(resp) {
            if (!resp.error) {
              resolve(resp);
            }
            else {
              reject(resp.error);
            }
          }, reject);
      });
    };


    /**
      * Wrapper method that generates a certain number of Google IDs
      * @method generage_ids
      * @param {Integer} maxResults # of ID's to generage
      * @return {Promise} Returns a Promise object, resolve contains
      * the array with Google ID's
      */


    exports.generage_ids = function(maxResults){
      return new Promise(function(resolve,reject){
          var request = gapi.client.drive.files.generateIds({
            'maxResults': maxResults
          });
          try {
            request.execute(function(resp) {
              if (!resp.error) {
                resolve(resp);
              }
              else {
                reject(resp.error);
              }
            }, reject);
          }
          catch (e){
            return reject(e.message);
          }

      });
    };



    /*
      Function getting the content of a ipynb file.
      Arguments:
        - fileId - ID of the ipynb file on Google Drive
    */

    /**
      * Wrapper method that retrives the JSON contant of a notebook ipynb file
      * @method file_get_notebook
      * @param {String} fileId Google ID of file
      * @param {String} logs - Optional paramenter, class name of the DOM element
      * which will show the output of the operation.
      * @return {Promise} - Promise object containing the JSON content of notebook
      */
    exports.file_get_notebook = function(fileId,logs){
      console.log('Entering function <<file_get>>. Retrieving file id ' + fileId );
      $(logs).append($(document.createElement('span')).text('Entering function <<file_get>>. Retrieving file id ' + fileId));
      return new Promise(function(resolve, reject){
        var request = gapi.client.drive.files.get({
          'fileId': fileId
        });
        request.execute(function(file) {
          if (file.downloadUrl && file.fileExtension === 'ipynb') {
            var accessToken = gapi.auth.getToken().access_token;
            //console.log(file);
            var xhr = new XMLHttpRequest();
            /* Seems to be a Google Drive bug for the downloadurl, need to replace the last part. */
            //xhr.open('GET', file.downloadUrl.replace('&gd=true',''));
            xhr.open('GET', file.downloadUrl, true);
            xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
            xhr.onreadystatechange = function( theProgressEvent ) {
              //console.log(theProgressEvent);
              if (xhr.readyState == 4) {
                  if(xhr.status == 200){
                      //console.log(fileId);
                      //console.log(accessToken);
                      //console.log(xhr.status);
                      resolve(JSON.parse(xhr.responseText));
                  }
                  else {
                      //console.log(fileId);
                      //console.log(accessToken);
                      //console.log(xhr.status);
                      reject(xhr.statusText);
                  }
              }
            };
            /*
            xhr.onload = function(resp) {
              resolve(JSON.parse(xhr.responseText));
            };

            xhr.onerror = function(resp) {
              reject(resp.error);
            };
            */
            xhr.send();
          } else {
            reject();
          }

        });
      });

    };


    /**
      * Wrapper method that retrives the contant of a file in Google Drive
      * @method file_get_content
      * @param {String} fileId Google ID of file
      * @param {String} logs - Optional paramenter, class name of the DOM element
      * which will show the output of the operation.
      * @return {Promise} - Promise object containing the content of file
      */
    exports.file_get_content = function(fileId,logs) {
      console.log('Entering function <<file_get>>. Retrieving file id ' + fileId );
      $(logs).append($(document.createElement('span')).text('Entering function <<file_get>>. Retrieving file id ' + fileId));
      return new Promise(function(resolve, reject){

        var request = gapi.client.drive.files.get({
          'fileId': fileId
        });
        request.execute(function(file) {
          var accessToken = gapi.auth.getToken().access_token;
          var xhr = new XMLHttpRequest();
          xhr.open('GET', file.downloadUrl);
          xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
          xhr.onreadystatechange = function( theProgressEvent ) {
            if (xhr.readyState == 4) {
                if(xhr.status == 200){
                    resolve(xhr.responseText);
                }
                else {
                    reject(xhr.statusText);
                }
            }
          };
          xhr.send();
        });

      });
    };


  });
