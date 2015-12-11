/**
 * helper_jqbuilder module is a collection of helper functions used to dynamically build
 * DOM objects (generate HTML code) using JQuery. These objects are either used in the master or wizard page
 * for displaying popups, generating some of the wizard components or generating a
 * overview of the project.
 * @module helper_jqbuilder
 * @author Cristian Anastasiu
 */


define(['exports',
  'nbextensions/gdrive/gapiutils',
  "require",
  'jquery',
  'base/js/utils',
  'nbextensions/ma/client/common/js/googledrive/gdapi'
], function(exports, gapiutils, require, $, utils, gdapi) {


  /**
   * The popup object contains a number of functions which return HTML code
   * that can be displayed inside the magnific popup widget.
   */

  exports.popup = {};

  /**
   * This method generates a DOM object containing a simple popup
   * which displays a title,  key / value pairs in form of labels and inputs
   * and a message output placeholder
   * @method FormSimple
   * @param {Object} obj - Object containing key/value pairs
   * @param {String} title - Title of popup
   * @exports popup.FormSimple
   * @return {Object} popup - returns the Object containing the DOM element
   */
  exports.popup.FormSimple = function(obj, title){
    var popup = $('<div/>', {class: 'white-popup'}).append(
              $('<h3/>', {text: title}),
              $('<div/>', {class: 'magnific_messages_wrapper'}).append(
                $('<div/>', {class: 'magnific_messages logs'})
              )
            );
    var key_value_span = function(key,val){
        return $('<div/>', {style: 'display: flex; display: -webkit-flex; flex-direction: row; -webkit-flex-direction: row; width: 100%', name: 'record'}).append(
          $('<span/>',{text: key, style: '-webkit-flex-basis: 100px;flex-basis: 100px; flex-grow: 1;-webkit-flex-grow: 1;', name: 'label'}),
          $('<textarea/>',{text: val, style: 'flex-grow: 2;-webkit-flex-grow: 2;', name: 'value'})
        );
    }

    if(obj){
      for(x in Object.keys(obj)){
        key = Object.keys(obj)[x]
        popup.append(key_value_span(key, obj[key]));
      }
    }
    return popup;
  };

  /**
   * This method generates a DOM object containing a popup.SimpleForm
   * with buttons at the bottom
   * @method FormButtons
   * @param {Array} brn_arr - Array containing button names
   * @param {Array} class_arr - Array containing button css classes
   * @param {Object} obj - Object containing key/value pairs
   * @param {String} title - Title of popup
   * @exports popup.FormButtons
   * @return {Object} returns the Object containing the DOM element
   */
  exports.popup.FormButtons = function(btn_arr,class_arr,obj, title){
      var w =  $(exports.popup.FormSimple(obj, title)).clone();
      var d =  $('<div/>',{class: 'actions'});
      var u =  $('<ul/>');
      for (x in btn_arr){
        $(u).append(
          $('<li/>', {class: class_arr[x]}).append(
            $('<a/>',{text: btn_arr[x]})
          )
        )
      }
      return $(w).append($(d).append(u))
  };


  /**
   * This method generates  DOM object containing a popup.SimpleForm
   * with a message and a icon/link
   * @method FormRedirect
   * @param {String} msg - Message to be displayed
   * @param {String} iconclass - css class of the icon, should be a FontAwesome class
   * @param {String} link - Link where the icon should point
   * @exports popup.FormRedirect
   * @return {Object} returns the Object containing the DOM element
   */
  exports.popup.FormRedirect = function(msg, iconclass, link){
    return $(exports.popup.FormSimple()).clone()
                  .append(
                    $('<div/>', {class: 'redirect_wrapper'}).append(
                      $('<span/>', {class: 'message', text: msg}),
                      $('<a/>', {href: link, style: (link) ? '': 'pointer-events: none;'}).append(
                        $('<span/>', {class: 'fa-stack fa-4x'}).append(
                            $('<i/>', {class: 'fa fa-circle fa-stack-2x icon-background'}),
                            $('<i/>', {class: 'fa fa-stack-1x ' + iconclass})
                        )
                      )
                    )
                  );

  };


  /**
   * This method generates a DOM object containing a message and a icon/link.
   * This element can be added in Popups after a specfic action has been performed,
   * i.e. a "succes" message after a project was created
   * @method RedirectWrapper
   * @param {String} msg - Message to be displayed
   * @param {String} iconclass - css class of the icon, should be a FontAwesome class
   * @param {String} link - Link where the icon should point
   * @exports popup.RedirectWrapper
   * @return {Object} returns the Object containing the DOM element
   */
  exports.popup.RedirectWrapper = function(msg, iconclass, link){
    return $('<div/>', {class: 'redirect_wrapper'}).append(
      $('<span/>', {class: 'message', text: msg}),
      $('<a/>', {href: link}).append(
        $('<span/>', {class: 'fa-stack fa-4x'}).append(
            $('<i/>', {class: 'fa fa-circle fa-stack-2x icon-background'}),
            $('<i/>', {class: 'fa fa-stack-1x ' + iconclass})
        )
      )
    );
  }

  /**
   * This method generates just a DOM object containing a form for
   * adding custom actions. Can be found in the wizard in the Action accordion.
   * @method AddAction
   * @exports popup.AddAction
   * @return {Object} returns the Object containing the DOM element
   */
  exports.popup.AddAction = function(){
    var af = $('<form/>', {class : 'white-popup'});

    $(af).append(
        $('<h3/>', {text: 'Add Custom action'}),
        $('<span/>', {id: 'addFormMessage'}),
        $('<input/>', {class : 'ainput', placeholder: 'Name', name: 'name'}),
        $('<textarea/>', {class: 'adescription', placeholder: 'Enter Description', name: 'description'}),
        $('<textarea/>', {class: 'adescription', placeholder: 'Enter Input', name: 'input'}),
        $('<textarea/>', {class: 'adescription', placeholder: 'Enter Ouput', name: 'output'}),
        $('<div/>', {class: 'actions'}).append(
                            $('<ul/>').append(
                              $('<li/>').append(
                                $('<a/>', {text: 'Submit', id: 'submitBtn'}))))
    );

    return af;
  }

  /**
   * This method generates  DOM object containing a popup.FormRedirect
   * with a message and a warning icon/link
   * @method Warning
   * @param {String} msg - Message to be displayed
   * @param {String} iconclass - css class of the icon, should be a FontAwesome class
   * @param {String} link - Link where the icon should point
   * @exports popup.Warning
   * @return {Object} returns the Object containing the DOM element
   */
  exports.popup.Warning = function(msg, iconclass, link){
    var popup = $(exports.popup.FormRedirect(msg, iconclass, link)).clone()
    $(popup).addClass('warning');
    $.magnificPopup.open({
      items: {
        src: popup,
        type: 'inline',
        closeBtnInside: true,
        fixedContentPos: true
      }
    });
  }



  /**
   * The wizard object contains a number of functions which return HTML code
   * that is displayed during the project creation wizard.
   */

  exports.wizard = {};

  /**
   * This methods builds a element which is responsible for displaying a
   * text. Used in every step at the top of step to display the description.
   * @method step_decription
   * @param {String} val - Description String
   * @exports wizard.step_decription
   * @return {Object} returns the Object containing the DOM element
   */
  exports.wizard.step_decription = function(val){
    var s = $(document.createElement('div')).addClass('stepdescription');
    $(s).append($(document.createElement('i')).addClass('fa fa-3x fa-lightbulb-o'));
    $(s).append($(document.createElement('span')).text(val));
    return s;
  }

  /**
   * This method generates the DOM object to display the data mining
   * bucket in step two of the wizard.
   * @method actionBuckets
   * @param {String} label - Label of the bucket, one of (eg. Load Data)
   * Depending on the label, a Font Awesome icon will be displayed
   * @param {String} description - Description of the bucket
   * @param {String} id - id of bucket
   * @exports wizard.actionBucket
   * @return {Object} returns the Object containing the DOM element
   */
  exports.wizard.actionBuckets = function(label, description, id) {

    var st = $('<span/>').addClass('stitle').text(label);

    var u = $('<ul/>');

    switch(label){
      case 'Load Data':
        st.append('<i class="fa fa-upload"/>');
        u = $('<ul data-icon="&#xf093;"></ul>');
        break;
      case 'Clean Data':
        st.append('<i class="fa fa-crop"/>');
        u = $('<ul data-icon="&#xf125;"></ul>');
        break;
      case 'Transform':
        st.append('<i class="fa fa-filter"/>');
        u = $('<ul data-icon="&#xf0b0;"></ul>');
        break;
      case 'Data Mining':
        st.append('<i class="fa fa-share-alt"/>');
        u = $('<ul data-icon="&#xf1e0;"></ul>');
        break;
      case 'Interpretation':
        st.append('<i class="fa fa-area-chart"/>');
        u = $('<ul data-icon="&#xf1fe;"></ul>');
        break;
    }
    var ms = $('<div/>', {id: id}).addClass('mining-step clearfix thin short');
    var msbody = $('<div/>').addClass('ms-body');


    /** We make the elements JQuery sortable, meaning that the buckets can receive
      * dragged elements from another ".dropable ul" element, sorting
      * inside the bucket is possible.
      * This is needed when Actions are dragged from the Accordion (in step two)
      * into the buckets. The user has the option to redrag the items into another bucket afterwards.
      *
      * For the specification of sortable please visit - https://jqueryui.com/sortable/
      */

    $(u).sortable({
      connectWith: ".dropable ul",
      items: "li.action-item",
      stop: function(e,ui) {
        if($(ui.item).children('i').length == 0){
          $(ui.item).append($('<i class="fa fa-minus"></i>').on('click', function(){
            $(ui.item).remove();
          }));
        }
        else {
          $(ui.item).children('i').remove();
          $(ui.item).append($('<i class="fa fa-minus"></i>').on('click', function(){
            $(ui.item).remove();
          }));

        }
      }
    }).disableSelection();

    $(ms).append(
        $(msbody).append(st).append($('<div/>').addClass('dropable').append(u))
    );

    return ms;
  }


  /**
   * This method generates the DOM object to display the action queue
   * in step three of the wizard.
   * @method actionQueue
   * @exports wizard.actionQueue
   * @return {Object} returns the Object containing the DOM element
   */

  exports.wizard.actionQueue = function() {
    return $('<div/>', {class: 'mining-step clearfix step3'}).append(
              $('<div/>', {class: 'ms-body'}).append(
                $('<span/>', {class: 'stitle', text: 'Action Queue'}).append(
                  $('<i/>', {class: 'fa fa-list'})
                ),
                $('<div/>', {class: 'acont'})
              )
            );
  };

  /**
   * This method generates the DOM object to display the two chevrons
   * in step three of the wizard. The chevrons are used to move action
   * items from the queue to assignment or other way around
   * @method actionChevron
   * @exports wizard.actionChevron
   * @return {Object} returns the Object containing the DOM element
   */

  exports.wizard.actionChevron = function() {
    return $('<div/>',{class: 'chevron mining-step clearfix step3'}).append(
                $('<a/>').prepend($('<i/>', {class: 'fa fa-chevron-right'})).click(
                  function() {
                    $('.acont .action-item').first().appendTo($('.assignment.aactive .aactions ul').first());
                  }
                ),
                $('<a/>').prepend($('<i/>', {class: 'fa fa-chevron-left'})).click(
                  function() {
                    $('.assignment.aactive .aactions ul li').first().prependTo($('.acont').first());
                  }
                )
    );
  }

  /**
   * This method generates the DOM object "+" used to add assignments
   * in the third step.
   * @method assignmentContainer
   * @exports wizard.assignmentContainer
   * @return {Object} returns the Object containing the DOM element
   */

  exports.wizard.assignmentContainer = function() {
    var arr = $('<div/>', {class: 'mining-step clearfix large step3'});
    var newas = $('<a/>').append($('<i/>', {class: 'fa fa-plus fa-2x'}));

    $(newas).on('click',function(event) {
      var as = createAssignmentWrapper();
      /**
        * When clicking on the + button, a new assignment wrapper is
        * added to the page
        */
      $(as).on('click', 'i.fa-times', function(){
        $('.assignment.aactive .aactions ul li').prependTo($('.acont').first());
        $(as).remove();
      });

      /**
        * Make the current assignment active when focus is on.
        * Only one assignment can be active and actions can be added
        * only to active assignments.
        */
      $(as).focus(function() {
        $(".aactive").each(function(index) {
          $(this).removeClass('aactive');
        });
        $(this).addClass('aactive');
      });

      $(".aactive").each(function(index) {
        $(this).removeClass('aactive');
      });

      /**
        * Make the current assignment active. New created assignments
        * are the active ones.
        */
      $(as).addClass('aactive');

      $(newas).before(as);
    });

    $(arr).append(newas);
    return arr;
  }

  /**
   * This method generates the assignment DOM object when the "+" icon is clicked
   * @method createAssignmentWrapper
   * @return {Object} returns the Object containing the DOM element
   */
  var createAssignmentWrapper = function(){
    return $('<div/>', {class: 'assignment', 'tabindex': 1}).append(
                $('<span/>', {text: 'Assignment', class: 'stitle'}).append(
                    $('<i/>', {class: 'fa fa-times'})
                ),
                $('<div/>').append(
                    $('<div/>', {style: 'display: table; width: 100%'}).append(
                        $('<i/>', {class: 'fa fa-list'}),
                        $('<div/>', {class: 'aactions', 'data-ph': 'Add actions'}).append($('<ul/>'))
                    ),
                    $('<div/>', {style: 'display: table; width: 100%'}).append(
                        $('<i/>', {class: 'fa fa-sticky-note', style: 'vertical-align: top; padding: 10px 1em'}),
                        $('<textarea/>', {class: 'adescription', placeholder: 'Enter assignment description'})
                    ),
                    $('<div/>', {style: 'display: table; width: 100%;'}).append(
                        $('<i/>', {class: 'fa fa-user'}),
                        $('<input/>', {class: 'ainput', name: 'owner', placeholder: 'Owner Email Address'}).attr('autocomplete', 'on')
                    )
              )
            );
  }




  /**
   * The project object contains a number of functions used to display the project JSON
   * object.
   */
  exports.project = {}


  /**
   * This method is called in the last step and fills the project JSON object
   * with missing assignment information.
   * If goes through every assignment and extracts the needed metadata, like
   * assignment id, description, owner and actions.
   * @method createJSON
   * @param {Object} obj - The JSON object
   * @exports project.actionBucket
   * @return {Object} returns the JSON object
   */
  exports.project.createJSON = function(obj) {
    obj['bundles'] = [];
    $(".step3 .assignment").each(function(index) {
      var bundle = {};
      bundle['id'] = $(this).find(".atitle").first().text();
      bundle['description'] = $(this).find(".adescription").first().val();
      bundle['owner'] = $(this).find(".ainput").first().val();
      var bactions = [];

      $(this).find('.aactions .action-item').each(function(index) {
        console.log($(this).attr('nid'));
        var baction = {};
        baction['id'] = $(this).attr('nid');


        baction['name'] = g_projactions[$(this).attr('nid')]['name'];
        baction['input'] = g_projactions[$(this).attr('nid')]['input'];
        baction['output'] = g_projactions[$(this).attr('nid')]['output'];
        baction['description'] = g_projactions[$(this).attr('nid')]['description'];


        bactions.push(baction);

      });
      bundle['actions'] = bactions;
      obj['bundles'].push(bundle);

    });
    return obj;
  }

  /**
   * This method is used to create a DOM element displaying all the project
   * information based on the information in the project object.
   * It is called in the last step of the wizard and on the master page.
   * @method display
   * @param {Object} jsonobj - The JSON object
   * @exports project.display
   * @return {Object} returns the Object containing the DOM element
   */

  exports.project.display= function(jsonobj) {

    var f_pspan = function(label, val){
      return $('<div/>',{class: 'fw'}).append(
        $('<span/>', {class: 'fw-label', text: label}),
        $('<span/>', {class: 'fw-value', text: val})
      )
    }

    var f_picon = function(fonticon, val){
      return $('<div/>', {class: 'fw'}).append(
        $('<i/>', {class: 'fw-icon fa '+fonticon}),
        $('<span/>', {class: 'fw-value', text: val})
      );
    }

    var f_picondiv = function(fonticon, content){
      return $('<div/>', {class: 'fw'}).append(
        $('<i/>', {class: 'fw-icon fa '+fonticon}), content
      );
    }

    var pre = $('<div/>', {class: 'proverview'}).append(
      $('<h3/>', {text: jsonobj['name']})
    );


    var pre_split = $('<div/>', {class: 'split two'});

    var pre_right = pre_split.clone();
    var pre_left  = pre_split.clone();

    var ras = $('<div/>');

    for (x in jsonobj.bundles){
      var asw = createAssignmentWrapper();

      for (y in jsonobj.bundles[x]['actions']){
        var l = $('<li/>',{class: 'action-item'})
                .append($('<a/>', {text: jsonobj.bundles[x]['actions'][y]['name']}));

        $(l).appendTo($(asw).find('.aactions ul').first());
      }
      $(asw).find('.stitle i').remove();
      if(typeof jsonobj.bundles[x]['name'] != 'undefined'){
          var a = $('<a/>', {text: jsonobj.bundles[x]['name'], href: '/notebooks/' + jsonobj['gid'] + '/' + x + '_notebook.ipynb', target: 'blank'})
          $(asw).find('.stitle').append(a)
      }
      $(asw).find('.adescription').attr('readonly', true).val(jsonobj.bundles[x]['description']);
      $(asw).find('.ainput').attr('readonly', true).val(jsonobj.bundles[x]['owner']);
      $(ras).append(asw);
    }


    $(pre_left).append(f_pspan('Kernel',jsonobj['kernel']));
    if(typeof jsonobj['gid'] != 'undefined'){
      $(pre_left).append(f_pspan('ID',jsonobj['gid']));
    }
    if(typeof jsonobj['created_date'] != 'undefined'){
      $(pre_left).append(f_picon('fa-lg fa-calendar',jsonobj['created_date']));
    }
    $(pre_left).append(f_picon('fa-lg fa-user',jsonobj['owner']));
    var description = f_picon('fa-lg fa-sticky-note',jsonobj['description']);
    $(description).find('.fw-value').addClass('overflow150');
    $(pre_left).append(description);


    $(pre_right).append(f_picondiv('fa-lg  fa-tasks',ras));

    $(pre).append(pre_left, pre_right)

    return pre;
  }


  /**
   * This method is used to display the project JSON object in a <pre> element
   * with no formatting.
   * @method displayJSON
   * @param {Object} jsonobj - The JSON object
   * @exports project.displayJSON
   * @return {Object} returns the <pre> Object containing the DOM element
   */

  exports.project.displayJSON = function(jsonobj) {
    var pre = document.createElement('pre');
    $(pre).css('height', '100%');
    $(pre).css('display', 'block');
    $(pre).css('overflow', 'scroll');
    $(pre).text(JSON.stringify(jsonobj, null, 4));
    return pre;
  }

  /**
   * This method returns an FontAwesome icon based
   * on the parameter value. Used in the project overview
   * page
   * @method getActObjIcon
   * @param {String} val
   * @exports project.getActObjIcon
   */
  exports.project.getActObjIcon = function(val){
    if (val == "comment"){
      return '<i class="fa fa-comment"></i>';
    }
    else if(val == "notebook"){
      return '<i class="fa fa-file-text"></i>';
    }
    else if(val == "project"){
      return '<i class="fa fa-folder"></i>';
    }
    else{
      return val;
    }
  }


  /**
   * This method is used to create a content editable paragraph
   * with the id "p_variables" and append it to another element
   * identified through the string "parent"
   * @method createParagraph
   * @param {String} text - content of paragraph
   * @param {String} parent - class or id used to identify the parent using JQuery
   * and add the paragraoh
   * @exports project.createParagraph
   */
  exports.createParagraph = function(text, parent) {
    var p = $('<p/>', {html: text, contenteditable: 'true', id: 'p_variables'});
    $(parent).html(p);
  }
});
