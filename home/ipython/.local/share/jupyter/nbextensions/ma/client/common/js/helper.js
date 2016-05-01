/**
 * Helper Module is a collection of helper functions used by the custom master and wizard pages.
 * It also contains the functions used to create projects, delete project or merge notebooks.
 * These functions perform a squence of REST API's
 * {Function} load_css
 * {Function} load_js
 * {Function} uniqueid
 * {Function} validateEmail
 * {Function} mergeNBFlat
 * {Function} createNBFlat
 * {Function} removeNBFlat
 * {Function} addEvent
 * @author Cristian Anastasiu
 * @module helper
 */

define(['exports',
  'nbextensions/gdrive/gapiutils',
  "require",
  'jquery',
  'base/js/utils',
  'nbextensions/ma/client/common/js/googledrive/gdapi'
], function(exports, gapiutils, require, $, utils, gdapi) {

   /**
     * Helper method for appending text to a specific DOM element using JQuery
     * @method mlog
     * @param {String} obj Class or ID of object that can be referenced using jQuery
     * @param {String} text
     */
   var mlog = function(obj, text) {
     $(obj).append($(document.createElement('span')).text(text));
   };

   /**
     * Method for loading a css file into the page header
     * @method load_css
     * @param {String} name - path of css file
     */
  exports.load_css = function(name) {
    var link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = require.toUrl(name);
    document.getElementsByTagName("head")[0].appendChild(link);

  };

  /**
    * Method for loading a Javascript file into the page header
    * @method load_js
    * @param {String} name - path of css file
    */
  exports.load_js = function(name) {
    var script = document.createElement("script");
    script.charset = "utf-8";
    script.src = require.toUrl(name);
    document.getElementsByTagName("head")[0].appendChild(script);
  }

  /**
    * Method for generating unique IDs
    * @method uniqueid
    * @return {String} an unique ID
    */
  exports.uniqueid = function() {
    // always start with a letter (for DOM friendlyness)
    var idstr = String.fromCharCode(Math.floor((Math.random() * 25) + 65));
    do {
      // between numbers and characters (48 is 0 and 90 is Z (42-48 = 90)
      var ascicode = Math.floor((Math.random() * 42) + 48);
      if (ascicode < 58 || ascicode > 64) {
        // exclude all chars between : (58) and @ (64)
        idstr += String.fromCharCode(ascicode);
      }
    } while (idstr.length < 32);

    return (idstr);
  }

  /**
    * Method for validating an email address.
    * @method validateEmail
    * @param {email} String of the email address which needs to be validated
    * @return {Boolean} true if the string is valid email, else false
    */
  exports.validateEmail = function(email) {
    var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    return re.test(email);
  }


  /**
    * Method for merging the notebooks of a project to a master.ipynb notebook
    * Service calls in this transactions are flattened, this means that the Promises are executed
    * sequentially.
    * @method mergeNBFlat
    * @param {String} gid - Google ID of the project
    * @param {String} logs - class or ID of DOM element where log output will be written
    * @return {Promise} Promise object, resovle will contain text "Merging was successful"
    * @exports mergeNBFlat
    */
  exports.mergeNBFlat = function(gid, logs) {
    return new Promise(function(resolve, reject) {

      /**
        * Helper function which gets triggered when an exception occurs or one of the REST service
        * calls is unsuccesful.
        * @param {String} reason - Exception which occured and triggered the rollback
        * @return {Promise} Promise reject()
        */
      var rollback = function(reason){
        if(typeof reason.statusText != 'undefined'){
            mlog(logs, 'Something went wrong: ' + reason.statusText);
        }
        else{
            mlog(logs, 'Something went wrong: ' + reason);
        }

        return reject();
      }
      try{
        /* First we check if the user is authenticated, then we proceed */
        Promise.all([gdapi.authorize])
        .then(function(){

          /** REST call to the backend to get the project payload. The service retrieves only the
            * projects where the current user is either the owner or one of the workers.
            */
          return $.ajax({
            url: "/distprojects/" + gid,
            contentType: 'application/json,charset=UTF-8',
            type: 'GET',
            dataType: 'json',
            data: {'username': gdapi.getCurrentUser().id},
          });
        }).then(function(result){

          /** If payload is retrieved, we loop throug all the assignments (bundles),
            * get the notebook ID for each assignment and create an Array of Promises
            * which retrieve the content of each notebook ipynb file from Google Drive
            */
          var promises = [];
          for (i = 0; i < result.bundles.length; i++) {
            promises.push(gdapi.file_get_notebook(result.bundles[i].gid, logs));
          }
          master_nb = {
            cells: [],
            nbformat: 4,
            nbformat_minor: 0,
            metadata: {}
          }
          return Promise.all(promises);
        }).then(function(results){
          /** If contents of the notebook files were retrieved, the creation of the master
            * notebook starts. We go through each of the notebook sequentially (sequence
            * defined by the prefix), extract the notebook cells and push them into the
            * master notebook.
            */
          mlog(logs, 'Merging files in master notebook ...');
          for (var x in results) {
            for (var y in results[x].cells) {
              if(results[x].cells[y]['metadata']['variable_cell'] != true && results[x].cells[y]['metadata']['common'] != true){
                master_nb['cells'].push(results[x].cells[y]);
              }
            }
          }
          mlog(logs, 'Done merging ...');

          /** If merging is done, we store the master notebook in Google Drive as master.ipynb.
            */
          console.log(JSON.stringify(master_nb));
          mlog(logs, 'Inserting merge notebook in Google Drive ...');
          return gdapi.file_insert(JSON.stringify(master_nb), 'master.ipynb', gid);
        }).then(function(res){

          /** We track this as an event as store it in mongo db
            */
          var evt = {
            "gid": gid,
            "type": "merge",
            "obj_type": "project",
            "obj_id": "",
            "obj_name": "",
            "obj_value": "",
            "user": "cristiananastasiu@gmail.com"
          };
          exports.addEvent(evt);
          mlog(logs, 'Done.');
          return resolve('Merging succesful');
        }).catch(function(reason){

          /** In case of a reject in the Promise chain we call the rollback function.
            */

          rollback(reason);
        });
      }
      catch(e){

        /** In case of a exception we call the rollback function.
          */

        rollback(e);
      }
    });
  };


  /**
    * Method for creating the project at the end of the wizard. This function constists of a chain of Promises
    * and REST service calls.
    * The sequence of actions is:
    * 1. Check if user is authenticated
    * 2. Generate Google ID's for project, notebooks and shared.txt file
    * 3. Call the convert REST service and convert the project payload into a payload that contains standard IPython
         notebook content for each of it's assignments.
    * 4. Create project folder in Google Drive if it doesnt exist.
    * 5. Add owner permission to folder for the current user
    * 6. Insert the file shared.txt into the project folder.
    * 7. Insert for each assignment a notebook into the project folder
    * 8. Give the assignment owner write permission on his notebook assignment and read permission for rest of notebooks.
         Give write permission for shared.txt
    * 9. Store the project in Mongo DB, create FTP folder
    * 10. Is something goes wrong along the way, call rollback() function.
    * @method createNBFlat
    * @param {Object} nb - Project object
    * @param {String} logs - class or ID of DOM element where log output will be written
    * @return {Promise} Promise object, resovle will contain text "Merging was successful"
    * @exports createNBFlat
    */

  exports.createNBFlat = function(nb, logs) {

    return new Promise(function(resolve, reject) {

      /**
        * Helper function which gets triggered when an exception occurs or one of the REST service
        * calls is unsuccesful.
        * The function performs a rollback of the transaction, meaning it will delete the
        * project from the database if it was created, it will delete the local folder on
        * the server used for ftp upload and it will delete the folder structure from Google Drive.
        * @method rollBack
        * @param {String} reason - Exception which occured and triggered the rollback
        * @return {Promise} Promise reject()
        */

      var rollback = function(reason){
        if(typeof reason.message != 'undefined'){
            mlog(logs, 'Something went wrong: ' + reason.message.toString());
        }
        else{
            mlog(logs, 'Something went wrong: ' + reason.toString());
        }
        mlog(logs, 'Entering rollback');
        exports.removeNB(nb.gid, logs);
        return reject();
      }

      var workers = [];
      try{
        /** First check if user is authenticated.
          */
        Promise.all([gdapi.authorize])
        .then(function() {
          mlog(logs, 'Generating Google IDs for project ...');

          /** Generate Google ID's which will be used to create folders / notebooks
            */
          return gdapi.generage_ids(2 + nb['bundles'].length);
        }).then(function(res_ids){
          nb.gid = res_ids.ids[0];

          /** Go through all the assignments and set their Google ID
            */
          for (x in nb.bundles) {
            workers.push(nb.bundles[x].owner);
            nb.bundles[x].gid = res_ids.ids[parseInt(x) + 1];
          }

          /** Set Google ID for the shared.txt file
            */
          nb.variablesid = res_ids.ids[res_ids.ids.length - 1];
          mlog(logs, 'Converting to IPython notebook format.')

          /** Convert the project payload. This will convert the project assignments
            * stored in .bundles into the IPython notebook format.
            */

          return $.ajax({
            url: "/distprojects/convert",
            data: JSON.stringify(nb),
            contentType: 'application/json,charset=UTF-8',
            type: 'POST',
            dataType: 'json'
          });
        }).then(function(convert){
          nb = convert;
          mlog(logs, 'Conversion complete.');
          mlog(logs, 'Creating project folder it not exits');

          /** Create forlder project in Google Drive
            */

          return gdapi.file_create_if_not_exists(nb.gid, 'root', 'application/vnd.google-apps.folder', nb.gid)
        }).then(function(){
          mlog(logs, 'Adding permission for project folder');

          /** Add wirter permission for the user.
            */
          return gdapi.file_inserPermission(nb['gid'], nb.owner, 'user', 'writer', false);
        }).then(function(){
          mlog(logs, 'Inserting shared.txt');

          /** Insert the shared.txt file with the notes entered in the wizard step.
            */
          return gdapi.file_insert(nb.variables, 'shared.txt', nb['gid'], nb['variablesid']);
        }).then(function(){
          var opromises = [];
          for (i in nb.bundles) {

            /** For each assignment insert a notebook in Google Drive, set prefix based on assignment order
              */
            mlog(logs, 'Inserting ' + i + '_notebook.ipynb' + ' notebook.');
            opromises.push(gdapi.file_insert(nb.bundles[i].notebook, i + '_notebook.ipynb', nb['gid'], nb.bundles[i]['gid'], 'application/ipynb'));
            nb.bundles[i]['name'] = i + '_notebook.ipynb';
          }
          return Promise.all(opromises);
        }).then(function(){
          var mpromises = [];

          var workers_unique = Array.from(new Set(workers));
          for (l in workers_unique) {
            /** Set reader permission for the project folder if user is not the project owner
              * Set writer permission for the shared.txt file if user not the project owner
              */
            if(workers_unique[l] != nb.owner){
              mlog(logs, 'Setting permissions for ' + workers_unique[l] + ' for ' + 'shared notes and project');

              /** Generate email message for each of workers. This will be the content of the notification email received by Google.
                */
              var email_message = "A "+nb['kernel']+"-project "+nb['name']+" was created by " + nb['owner'] +" and a task was assigned to you. The task(s) " +
              "are represented in IPython as " + "notebook.ipynb files."+ " \n \n" +
              "Perform following steps in order: \n"+
              "- Add the folder containing this task (IPython notebook) to your Google Drive by clicking the 'Open' button below and then 'Add to Drive' \n "+
              "- Then go to http://pycard.ifi.uzh.ch:8888/master to view the project details and see which task is assigned to you. \n"

              mpromises.push(gdapi.file_inserPermission(nb.gid, workers_unique[l], 'user', 'reader', true, email_message));
              mpromises.push(gdapi.file_inserPermission(nb.variablesid, workers_unique[l], 'user', 'writer', false));
            }
          }

          for (j in nb.bundles){

            mlog(logs, 'Setting writer permission for ' + nb.bundles[j].owner + ' for ' + j + '_' +'notebook.ipynb');

            /** Set writer permission for the assignment owner for his notebook and shared.txt
              */
            //mlog(logs, 'Owner: ' + nb.owner);
            //mlog(logs, 'Worker: ' + workers[j]);

            mpromises.push(gdapi.file_inserPermission(nb.bundles[j].gid, nb.bundles[j].owner, 'user', 'writer', false));

          }



          return Promise.all(mpromises);
        }).then(function(){
          mlog(logs, 'Storing project in Mongo DB');

          /** Store project in DB and create FTP folder
            */
          return $.ajax({
            url: "/distprojects",
            data: JSON.stringify(nb),
            contentType: 'application/json,charset=UTF-8',
            type: 'POST',
            dataType: 'html'
          });
        }).then(function(res){
          mlog(logs, 'Done');
          resolve(res);
        }).catch(function(reason){

          /** If a reject() is received in the Promise chain, something went wrong and we trigger
            * the rollback function.
            */
          rollback(reason);
        });
      }
      catch(e){

        /** If an exception occured we trigger the rollback function.
          */
        rollback(e);
      }
    });
  };


  /**
    * Method for deleting a project.
    * Service calls in this transactions are flattened, this means that the Promises are executed
    * sequentially.
    * @method removeNBFlat
    * @param {String} gid - Google ID of the project
    * @param {String} logs - class or ID of DOM element where log output will be written
    * @return {Promise} Promise object
    * @exports removeNBFlat
    */
  exports.removeNBFlat = function(gid, logs) {
    mlog(logs, 'Removing project from Google Drive...');

    /**
      * Helper function which gets triggered when an exception occurs or one of the REST service
      * calls is unsuccesful.
      * @method rollback
      * @param {String} reason - Exception which occured and triggered the rollback
      * @return {Promise} Promise reject()
      */
    return new Promise(function(resolve, reject) {
      var rollback = function(reason){
        if(typeof reason.message != 'undefined'){
            mlog(logs, 'Something went wrong: ' + reason.message.toString());
        }
        else{
            mlog(logs, 'Something went wrong: ' + reason.toString());
        }
        return reject(reason);
      }
      mlog(logs, 'Deleting project id ' + gid);

      /** Calling method to delete project from Google Drive
        */
      gdapi.file_delete(gid).then(function(result) {
        mlog(logs, 'Removing project from DB ...');

        /** Calling Service to delete the project from the database and
          * its ftp folder from server.
          */
        return $.ajax({
          url: "/distprojects/" + gid,
          type: 'DELETE',
          dataType: 'html',
          data: {'username': gdapi.getCurrentUser().id}
        });
      }).then(function(){
        mlog(logs, 'Done');
        resolve();
      }).catch(function(reason){
        /** If a Promise in the chain returns reject(), output error message
          * through rollback function.
          */
        rollback(reason);
      });
    });
  }

  /**
    * Method for storing an event. This method is used to store specific events related to
    * projects and their notebooks in the database
    * An events is triggered when:
    * - A notebook is saved
    * - A merge operations is performed
    * - A comment is created or deleted.
    *
    * A sample structure of an event looks like:
    *  "obj_type": "notebook",
    *  "obj_name": "",
    *  "obj_value": "",
    *  "time": 184,
    *  "user": "Cristian Anastasiu",
    *  "_id": "5643951d70ffb74c9c05d483",
    *  "type": "save"
    *
    * @method addEvent
    * @param {String} evt - Event object
    * @return {Promise} Promise object
    * @exports addEvent
    */
  exports.addEvent = function(evt) {
    return new Promise(function(resolve, reject) {
      $.ajax({
        url: "/events",
        data: JSON.stringify(evt),
        contentType: 'application/json,charset=UTF-8',
        type: 'POST',
        dataType: 'json',
        succes: function(ret) {
          resolve(ret);
        },
        error: function(err) {
          reject(err);
        }
      });
    });
  };



});
