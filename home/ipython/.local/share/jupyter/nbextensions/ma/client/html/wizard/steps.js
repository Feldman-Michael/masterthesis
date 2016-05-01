
/**
 * Helper JS module responsible for generating
 * the wizard, the steps for the wizard and the accordion with the action
 * taxonomy
 * @author Cristian Anastasiu
 * @module main_wizard.js
 */

define([
  'base/js/namespace',
  'base/js/utils',
  'base/js/events',
  'exports',
  'jquery',
  'require',
  'nbextensions/gdrive/gapiutils',
  'nbextensions/ma/client/common/js/googledrive/gdapi',
  'nbextensions/ma/client/common/js/helper',
  'nbextensions/ma/client/html/wizard/accordion.js',
  'nbextensions/ma/client/common/js/helper_jqbuilder.js',
  'nbextensions/ma/client/common/js/jqsteps/jquery.steps.js',
  'nbextensions/ma/client/common/js/jqpopup/jquery.magnific-popup.js',
  'nbextensions/ma/client/common/js/dropdown/dropdown.js',
  'jqueryui'
], function(
  IPython,
  utils,
  events,
  exports,
  $,
  require,
  gapiutils,
  gdapi,
  helper,
  accordion_helper,
  builder
) {

  /* -- START WIZARD ---------------------------------------------------------------------------------------------- */

  var g_projobj = {
    "name": '',
    "owner": '',
    "description": ''
  }

  var gdist_project_actions = {};

  var step_decription = function(val){
    var s = $(document.createElement('div')).addClass('stepdescription');
    $(s).append($(document.createElement('i')).addClass('fa fa-3x fa-lightbulb-o'));
    $(s).append($(document.createElement('span')).text(val));
    return s;
  }


  var wizard_transitions = function(event, currentIndex, newIndex) {

    /* Update project JSON with the current actions*/
    g_projobj = builder.project.createJSON(g_projobj);
    g_projobj['owner'] = gdapi.getCurrentUser().id;

    if (currentIndex == 0) {
      /* Set the input values from 1st step into the global project object */
      g_projobj['kernel'] = $('#nbkernel').val();
      g_projobj['name'] = $('#gpname').val();
      g_projobj['description'] = $('#gpdescription').val();
      if(g_projobj['kernel'] == 0){
        builder.popup.Warning('Please select a kernel', 'fa-exclamation');
        return false;
      }
      if(g_projobj['name'].length  == 0){
        builder.popup.Warning('Enter a project name', 'fa-exclamation');
        return false;
      }
      if(g_projobj['description'].length  == 0){
        builder.popup.Warning('Enter the project description', 'fa-exclamation');
        return false;
      }
    }

    if (currentIndex == 1 && newIndex == 2) {
      /* Add all the previously added actions in the actions placeholder */

      $(".ms-body .dropable .action-item:visible").each(function(index) {
        $(".acont").append($(this));
      });


    }

    if (currentIndex == 2 && newIndex == 3) {
      /* Fill the global project JSON with the data */
      if(($(".step3 .ms-body .acont .action-item").length != 0)){
        builder.popup.Warning('Please assign all the actions from the queue', 'fa-exclamation');
        return false;
      }
      for (var x = 0; x < $('.aactions ul').length; x++){
        var tmp = $('.aactions ul')[x];
        if ($(tmp).children().length == 0){
          var n = (parseInt(x)+1)
          builder.popup.Warning('Please assing at least one action to the empty assignment ' + n, 'fa-exclamation');
          return false;
        }
      }

      if(g_projobj.bundles.length == 0){
        builder.popup.Warning('Please create at least one assignment', 'fa-exclamation');
        return false;
      }
      for(x in g_projobj.bundles){
        if(!helper.validateEmail(g_projobj.bundles[x]['owner'])){
          var n = (parseInt(x)+1)
          builder.popup.Warning('Enter a valid email address for assignment ' + n, 'fa-exclamation');
          return false;
        }
      }

    }


    if(currentIndex == 3){
        g_projobj['variables'] = $('#p_variables').html();
        console.log(g_projobj);
    }

    if (newIndex == 4) {
      /* Display JSON object */

      var pre = builder.project.display(g_projobj);
      $('#master-wizard-p-' + (newIndex)).html(pre);
      //$('#master-wizard-p-' + (currentIndex + 1)).append(pre);

    }
    return true;
  };

  /*
   * Initialize the wizard object
   */
  initWizard = function() {
    $("#master-wizard").steps({
      headerTag: "h3",
      bodyTag: "section",
      transitionEffect: 1,
      autoFocus: true,
      saveState: true,
      onStepChanging: wizard_transitions,
      onFinishing: function(event, currentIndex) {
        var popup = $(builder.popup.FormSimple()).clone();
        $.magnificPopup.open({
          items: {
            src: $(popup),
            type: 'inline',
            closeBtnInside: true,
            fixedContentPos: true
          }
        });

        helper.createNBFlat(g_projobj,'.magnific_messages').then(
          function(res){
            var redirect = $(builder.popup.RedirectWrapper('Click the link below to be redirected to the master page', 'fa-list', '/master')).clone().css('display','none');
            $(popup).append(redirect);
            $(redirect).fadeIn(1000);
          },
          function(err){
            var redirect = $(builder.popup.RedirectWrapper('An error has occured. The project cloud not been created. Please try again.', 'fa-exclamation')).clone().css('display','none');
            $(redirect).addClass('error');
            $(popup).append(redirect);
            $(redirect).fadeIn(1000);
          }
        );
      }
    });
  };

  /*
   * Initialize the wizard steps
   */
  initWizardSteps = function() {

      /*
       * Create two arrays wihch will contain the DOM objects for the each of the data mining steps. This arrays will later be added
       * as content for wizard step 1 and 2
       */


       var dmsteps = [
         "Load Data",
         "Clean Data",
         "Transform",
         "Data Mining",
         "Interpretation"
       ];

      var dms_2 = [];

      /* Go through all the steps returned from the AJAX call (stepshelper.initStep()) and add them in the 2 arrays */
      for (x in dmsteps) {
        dms_2.push(builder.wizard.actionBuckets(dmsteps[x]));
      }


      /*
       * Create accordion. Not optimal here, NEED TO CHANGE
       */

      var accordion = accordion_helper.init();

      /*
       * Add accordion to the step 2.
       */

      dms_2.unshift(accordion);



      var c1 =
      $(
        '<div>'+
        '<select class="span3" name="optionlist" id="nbkernel" tabindex="1" value="X-Men">'+
        '<option selected="selected" value="0">Select Kernel</option>'+
        '<option value="R">R</option>'+
        '<option value="Python">Python 3.4</option>'+
        '</select>'+
        '<input value="" id="gpname" class="ainput" placeholder="Project Name"/>' +
        '<textarea id="gpdescription" class="adescription" placeholder="Enter project description">'+
        'Robust Caffeine Affogato aroma so acerbic single pumpkin macchiato to plunger strong qui. Latte decaffeinated Galão carajillo black percolator redeye dark chicory cultivar press rich variety. Variety aftertaste fair acerbic black grounds to crema white extra americano blue. Fair that extra single grinder Shop aftertaste café aftertaste body spice coffee.' +
        '</textarea>'+
        '</div>'
      );

      var s1dt = "This is the first step in creating your project. Select the kernel, enter a name and description for the project. ID is generated automatically."


      $("#master-wizard").steps('add', {
        title: "Project Information",
        content: [step_decription(s1dt),$(c1).css('margin', '1%')]
      });

      $("select").dropkick();

      var s2dt = "In this step you will add the actions which need to be performed in the project. " +
      "Browse for actions in the accordion on the left side and Drag & Drop them in the buckets on the right side. You can add multiple actions to a bucket. " +
      "For adding custom " +
      "actions, click the 'Custom  Actions' menu -> 'Add Action' "

      $("#master-wizard").steps('add', {
        title: "Add Actions",
        content: [step_decription(s2dt),$(document.createElement('div')).append(dms_2).addClass('stepcontent')]
      });

      var s3dt = "Here you will assign the actions to users. First click on the '+' icon to create a new assignment. "+
      "Then click on the assignment to make it active, the bar will change to orange. Use the '>'-arrow to add actions to an active assignment."

      $("#master-wizard").steps('add', {
        title: "Assignments",
        content: [step_decription(s3dt),$(document.createElement('div')).append(builder.wizard.actionQueue(), builder.wizard.actionChevron(), builder.wizard.assignmentContainer()).addClass('stepcontent')]
      });

      var s4dt = "In order to avoid conflicts between notebooks and have a clean transition from one step to another, "+
      "use the Shared Notes. These contents will be stored in the project folder under  'shared.txt' . The contents of the file will be loaded and made visible in every notebook, "+
      "so it is a good place to register variable names used in the different steps or to provide feedback after an interation"


      var shared_notes = $('<div id="shared_notes" class="stepcontent"><p id="p_variables" contenteditable="true"></p></div>')

      var shared_notes_text = "<div>#### Use this place to coordinate input / output between different steps or share notes and requirement after iterations.</div>" +
                              "<div>#### This file is using markdown language.</div>" +
                              "<div><br></div>" +
                              "<div>#### Example - Coordinate between steps</div>" +
                              "<div>#### Variables used in steps</div>" +
                              "<div><br></div>" +
                              "<div>project.step2.csvtable</div>" +
                              "<div>project.step2.map</div>" +
                              "<div>project.step3.ggmap</div>" +
                              "<div><br></div>" +
                              "<div>#### Example - Iteration date <dd.mm.yyyy></div>" +
                              "<div>#### TO DOs</div>" +
                              "<div><br></div>" +
                              "<div>##### Step1</div>" +
                              "<div><br></div>" +
                              "<div>* add proper encoding to the imported data</div>" +
                              "<div>* remove column from dataframe</div>";


      $(shared_notes).children('p').html(shared_notes_text);

      $("#master-wizard").steps('add', {
        title: "Note Board",
        content: [step_decription(s4dt), shared_notes]
      });

      $("#master-wizard").steps('add', {
        title: "Summary",
        content: ''
      });


      /*



      */
  };

  $("select").dropkick();





  $(function() {

    /**
      * Initialize the Google Drive API and authentication
      */
    gdapi.init.then(
      function(res){
        /**
          *  Is Google API loaded, Initialize the wizard object
          */
        initWizard();

        /**
          * Initialize the wizard steps
          */

        initWizardSteps();
      }, function(err){
        console.log(err);
      }

    );
  });

});


/* -- END WIZARD ---------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------------------------------------------ */
