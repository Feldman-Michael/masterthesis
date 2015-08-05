define(
  [
    "require",
    "exports",
    'jquery',
    'base/js/utils'
  ],
  function(require, exports, $, utils) {

    var CLIENT_ID = '776637753772-e63kc1c3hpr0vfec424jg1sp44p6fgnm.apps.googleusercontent.com';
    var SCOPES = [
      'https://www.googleapis.com/auth/drive.file'
      // Add other scopes needed by your application.
    ];

    /* Load Google JS client script */
    var load_gscript = function () {
      return Promise.resolve($.getScript('https://apis.google.com/js/client.js'));
    };

    /* Load Google Drive client */
    var load_gd_client = function () {
      return new Promise(function (resolve, reject) {
        gapi.load('auth:client,drive-realtime,drive-share', function () {
          gapi.client.load('drive', 'v2', resolve('Google API loaded.'));
        });
      });
    };

    var authorize = function(){
      return new Promise(function (resolve, reject){
          gapi.auth.authorize({'client_id': CLIENT_ID, 'scope': SCOPES.join(' '), 'immediate': true}).then(
              function(val) {
                  console.log('Google API authentication successful.')
              },
              function(err) {
                  return gapi.auth.authorize({'client_id': CLIENT_ID, 'scope': SCOPES.join(' '), 'immediate': false}, resolve)
              }
          );
      });

    };

    var load_gdapi = load_gscript().then(load_gd_client);
    exports.init = Promise.all([load_gdapi]).then(authorize);


    /* File operations */



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

    exports.file_create = function(title, parent, type) {
      return new Promise(function (resolve, reject){
        request = gapi.client.drive.files.insert({
          'resource': {
            'title': title,
            'mimeType': type,
            'parents' : [{id: parent} ]
           }
        });
        request.execute(function(result){
          if(!result.error && result.id){
            console.log(result.title + ' created in folder '+parent+'.');
            resolve(result.id);
          }
          else{
            reject(result);
          }
        });
      });
    };

    exports.file_create_if_not_exists = function(t,p,mtype){
      return new Promise(function (resolve, reject) {
        exports.file_exists(t,p,mtype).then(function(res){
          if(!res){
            exports.file_create(t,p,mtype).then(function(val){
              resolve(val);
            }, reject);
          }
          else{
              resolve(res);
          }
        }, reject);
      });
    };

    exports.file_insert = function(fileData, filename, parentId) {
      return new Promise(function (resolve, reject){
        //console.log("Entering function insertFile");
        var boundary = '-------314159265358979323846';
        var delimiter = "\r\n--" + boundary + "\r\n";
        var close_delim = "\r\n--" + boundary + "--";


        var contentType = fileData.type || 'application/octet-stream';
        var metadata = {
            'title': filename,
            'mimeType': contentType,
            "parents": [{"id":parentId}]
        };

        var base64Data = btoa(fileData);
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

        var request = gapi.client.request({
            'path': '/upload/drive/v2/files',
            'method': 'POST',
            'params': {'uploadType': 'multipart'},
            'headers': {
                'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
            },
            'body': multipartRequestBody});
        request.then(function(file){
            console.log('File ' + file.result.title + ' inserted in parent ' + parentId);
            resolve(file.result);
        },function(reason){
            console.log('Error occured ' + JSON.stringify(reason.body));
            reject(reason);
        });


      });
    };

    exports.file_inserPermission = function(fileId, value, type, role) {
      //console.log('Entering function file_insertPermission');
      return new Promise(function (resolve, reject){
        var body = {
          'value': value,
          'type': type,
          'role': role
        };
        var request = gapi.client.drive.permissions.insert({
          'fileId': fileId,
          'sendNotificationEmails' : 'true',
          'resource': body
        });
        request.execute(function(result){
          if(!result.error && result.kind){
              console.log('Permission "'+role+'" for '+value+' added.');
              resolve(result);
          }
          else{
            reject(result);
          }
        });
      });
    };

    exports.file_delete = function(fileId){
      return new Promise(function(resolve,reject){
          var request = gapi.client.drive.files.delete({
            'fileId': fileId
          });
          request.execute(function(resp) { resolve(resp); }, reject);
      });
    };

    exports.file_get_notebook = function(fileId){
      console.log('Entering function file_get');
      return new Promise(function(resolve, reject){
        var request = gapi.client.drive.files.get({
          'fileId': fileId
        });
        request.execute(function(file) {
          if (file.downloadUrl && file.fileExtension === 'ipynb') {
            var accessToken = gapi.auth.getToken().access_token;
            var xhr = new XMLHttpRequest();
            xhr.open('GET', file.downloadUrl);
            xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
            xhr.onload = function() {
              //console.log(JSON.parse(xhr.responseText));
              resolve(JSON.parse(xhr.responseText));
            };
            xhr.onerror = function() {
              reject();
            };
            xhr.send();
          } else {
            reject();
          }

        });
      });

    };


  });
