/**
 * Helper module for displaying the Action taxonomy using an accordion.
 * Accordion is displayed in the second step of the wizard. Accordion displays the default taxonomy
 * but also provides the ability to extend the taxonomy with custom actions.
 * Module is using two external modules:
 * - multilevel.accordion
 * - fastlivefilter
 * @module accordion
 * @author Cristian Anastasiu
 */

define(
  [
    "require",
    "exports",
    'jquery',
    'base/js/utils',
    'nbextensions/ma/client/common/js/helper_jqbuilder.js',
    'nbextensions/ma/client/common/js/jqaccordion/plugin.multilevel.accordion.js',
    'nbextensions/ma/client/common/js/jqaccordion/plugin.fastlivefilter.js'
  ],
  function(require, exports, $, utils, builder) {

    /**
     * Helper method for displaying the "Add custom action" menu item in the accodion
     * @method f_add_custom
     * @return DOM object representing the "Add custom action" menu item
     */
    var f_add_custom = function() {
      var add_custom = $('<li/>', {class: 'maginific'})
        .append($('<a/>', {text: 'Add Action', href: '#', style: 'background-color: #f27935 !important;'})
        .prepend($('<i/>', {class: 'fa fa-plus-square-o acustom'})));

      /**
        * When Clicking on the menu item, a popup opens with the submit form
        * @event {click}
        */
      $(add_custom).magnificPopup({
        items: {

          /**
            * When Clicking on the submit button, a new action record is stored in the databased
            * and the accordion is refreshed
            * @event {submit}
            */
          src: $(builder.popup.AddAction().clone()).on('click', '#submitBtn', function(event) {
            // Stop the browser from submitting the form.
            event.preventDefault();

            /**
              * Getting all the key/value pairs from the form.
              */
            var ad = $('form.white-popup').serializeArray().reduce(function(obj, item) {
              obj[item.name] = item.value;
              return obj;
            }, {});

            // Default parent for custom actions is '999'
            ad['parent'] = "999";
            ad['type'] = 'default';

            /**
              * Calling the POST service with the JSON action record as data
              */
            $.ajax({
              type: 'POST',
              url: '/actions',
              data: JSON.stringify(ad),
              dataType: 'json'
            }).done(function(response) {
              $('#addFormMessage').text("Action with " + response.id + " was created.");
              setTimeout(function() {
                $.magnificPopup.close();

                /**
                  * Refresh Accordion Content
                  */
                $('#action_list').html(exports.init());
              }, 1000);

            });
          }),
          type: 'inline',
          closeBtnInside: true,
          fixedContentPos: true
        }
      });
      return add_custom;
    };



    /**
     * Helper method for displaying the "Add custom action" menu item in the accodion
     * @method f_remove_custom
     * @return DOM object representing the "Add custom action" menu item
     */
    var f_remove_custom = function(id) {

      return new Promise(function(resolve, reject) {
        if(typeof id != 'undefined'){
          $.ajax({
            url: "/actions/"+ id,
            contentType: 'application/json,charset=UTF-8',
            type: 'DELETE',
            dataType: 'json',
            success: function(res){
              resolve(res);
            },
            error: function(err){
              reject(err);
            }
          });
        }
        else {
          reject('ID is undefined. ');
        }

      });
    };

    /**
     * Helper method for displaying the "Edit action" popup. The popup allows the user
     * to edit the action item or to delete it.
     * @method f_edit_custom
     */
    var f_edit_custom = function(id){
      /**
        * Retrieve the action item data set using REST service call
        */
      $.ajax({
        type: 'GET',
        url: '/actions/' + id,
        dataType: 'json',
        success: function(obj){
          delete obj['type'];
          delete obj['parent'];

          /**
            * Create the "Edit Action" popup by using the helper method builder.popup.FormButtons
            * Make the "_id" field read-only
            */
          var popup = builder.popup.FormButtons(['Delete', 'Cancel', 'Save'],['delete', 'disabled', 'save'],obj, 'Edit Action').clone();
          $(popup).find('div:has(span:contains("_id"))').children('textarea').attr('disabled', true).attr('readonly','readonly');

          /**
            * Event triggered when clicking "Delete" button
            * @event {click} delete
            */

          $(popup).on('click', '.delete', function(){
            /**
              * Check if action item is used in next steps. If not, proceed with deletion.
              */
            if(!$('.step3').find('li[nid="'+id+'"]').length > 0){

              /**
                * Call REST service for deleting the object.
                */
              $.ajax({
                url: "/actions/"+ id,
                contentType: 'application/json,charset=UTF-8',
                type: 'DELETE',
                dataType: 'html',
                success: function(res){
                  /**
                    * If item was deleted succesfully, remove all the occurences of the item from
                    * the page (if was already added to an action bucket)
                    */
                  $('.dropable').find('li[nid="'+id+'"]').remove();
                  $.magnificPopup.close();

                  /**
                    * Reload action taxonomy / accordion
                    */
                  $('#action_list').html(exports.init());
                },
                error: function(err){
                  $(popup).find('.logs').first().append(err.statusText);
                  console.log(err);
                }
              });
            }
            else{
              /**
                * If action item is used in further steps, notify the user that action can not be deleted.
                */
              $(popup).find('.logs').first().html('<span style="color: red;">Action is in usage. Can not be deleted, it is ' +
               'being used in a further step. Remove the action from the assignment and action queue first, then try to delete it again.</span>');
            }
          });

          /**
            * Event triggered when clicking on cancel. Popup will close
            * @event {click} cancel
            */
          $(popup).on('click', '.disabled', function(){
            $.magnificPopup.close();
          });

          /**
            * Event triggered when saving the changes. Update the action item when clicking save.
            * @event {click} save
            */
          $(popup).on('click', '.save', function(){
            var o = {};

            /**
              * Retrieve all the key/value pairs from input fields, store them into the
              * object which will be sent as data in the REST service call
              */
            $(popup).children('div[name="record"]').each(function () {
                o[$(this).children('[name="label"]').first().text()] = $(this).children('[name="value"]').first().val();
            });

            /**
              * Call the action update service (PUT)
              */
            $.ajax({
              type: 'PUT',
              url: '/actions',
              data: JSON.stringify(o),
              dataType: 'html',
              success: function(){
                /**
                  * If update was succesful, update all the other occurences on the page.
                  */
                $('li[nid="'+id+'"].action-item > a').text(o['name']);
                $.magnificPopup.close();
                $('#action_list').html(exports.init());
              },
              error: function(err){
                $(popup).find('.logs').first().append(err.statusText);
              }
            })
          });


          /**
            * Display the popup.
            */
          $.magnificPopup.open({
            items: {
              src: popup,
              type: 'inline',
              closeBtnInside: true,
              fixedContentPos: true
            }
          });
        }
      });
    };




    /**
     * Helper method used to parse the results of the GET service calls, which retrieves all the
     * action taxonomy. This method is used parse the results and build the accordion tree.
     * This is a recursive method which expects a tree structure (node) and the DOM element (elem) to store the node's children
     * The functin will populate the accordion and make all the leafs (action items) draggable. The actions can then
     * be dragged & dropped into the action buckets.
     * @param {Object} node - Tree node
     * @param {Object} elem - DOM element - <ul/>
     * @return {Object} elem with action items
     * @method parseResult
     */
    var parseResult = function(node, elem) {
      /**
        * First, we go through all the children of the node.
        */

      for (var i = 0; i < node.children.length; i++) {

        /**
          * Add each child as a list item in our elem
          */
        var l = $('<li/>');
        var a = $('<a/>', {text: node.children[i]['name'], href: '#'});


        /**
          * If item is one of the custom actions, we add an edit button (pencil icon),
          * and the associated event when clicking on it
          */
        if(node.children[i]['parent'] == '999'){
          $(a).prepend($('<i/>', {class: 'fa fa-pencil acustom', _id: node.children[i]['_id']}));
          $(l).append(a);

          /**
            * Event triggered when clicking on the edit icon of the custom action.
            * @event {edit} Edit custom action.
            */
          $(l).on('click','i.acustom',function(){
            f_edit_custom($(this).attr('id'));
          });
        }
        else{
          $(l).append(a);
        }


        /**
          * If child is a category, go though all the children
          */
        if (node.children[i].children.length > 0) {

          /**
            * Call function recusive for each of the child
            */
          var u = $('<ul/>', {class: 'submenu'});
          $(l).append(parseResult(node.children[i], u));

          /**
            * Because this is a category, we will not allow users to drag&drop the items into
            * the action buckets on the right side.
            */
          $(l).children('a').on('dragstart', function(event) {
            event.preventDefault();
            builder.popup.Warning('Categories can not be dragged, only the leafs. Click on the + sign to navigate to the leafs in the tree.', 'fa-exclamation');
          });
        }
        /**
          * If child is a leaf, make it draggable, add action to global g_projactions variable
          */
        else {
          g_projactions[node.children[i]['id']] = node.children[i];
          $(l).draggable({
            connectToSortable: ".dropable > ul",
            forcePlaceholderSize: false,
            helper: "clone",
            zIndex: 9999,
            appendTo: 'body',
            revert: 'invalid'
          }).disableSelection();
          $(l).attr('nid',node.children[i]['id']).addClass('action-item');
        }

        /**
          * If child is the "Custom actions" category, add the "Add action" subitem
          * and put item as first in the list. Else, append the item to the list.
          */
        if (node.children[i]['id'] == '999') {
          $(l).children('ul').prepend(f_add_custom());
          /*
          $(l).has('ul').length ? $(l).children('ul').prepend(f_add_custom()) : $(l).append(
            $('<ul/>', {class: 'submenu'}).append(f_add_custom())
          )
          */
          $(elem).prepend(l);
        } else {
          $(elem).append(l);
        }
      }
      return elem;
    };


    /**
     * Main method which retrieves the action taxonomy (tree) and populates the accordion.
     * To render the action taxonomy as an accordion, the external multilevel.accordion is used
     * @method init
     * @exports init
     * @return {Object} DOM object, respresenting the accordion.
     */
    exports.init = function() {
        var accordion_wrapper = $('<div/>', {id: 'action_list', class: 'menu blue'}).empty();

        /**
          * Calling REST service for retrieving the actions taxonomy / tree
          */
        $.ajax({
          url: "/actions/tree",
          contentType: 'application/json,charset=UTF-8',
          type: 'GET',
          dataType: 'json',
          success: function(res){
            g_projactions = {};
            var items = $.parseJSON(res['items']);
            var accordion_title = $('<div/>', {class: 'menu-header', text: 'Action picker'});

            /**
              * Parse the results
              */
            var accordion_list = parseResult(items, $('<ul/>'));

            $(accordion_wrapper).append(accordion_title, accordion_list);

            /**
              * Display DOM element as an accordion, by using external plugin
              */
            jQuery(document).ready(function($) {
              $(accordion_wrapper).maccordion();
            });

          }
        });

        return accordion_wrapper;

      };

  });
