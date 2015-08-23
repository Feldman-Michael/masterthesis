require([
  'base/js/namespace',
  'base/js/utils',
  'base/js/events',
  'jquery',
  'require',
  'contents',
  'services/config',
  'nbextensions/gdrive/gapi_utils',
  'nbextensions/ma/client/dist_project/gdapi',
  'nbextensions/ma/client/dist_project/dist_project_helper',
  'jqueryui',
  'nbextensions/ma/client/dist_project/jqsteps/jquery.steps.js',
], function(
  IPython,
  utils,
  events,
  $,
  require,
  contents,
  configmod,
  gapiutils,
  gdapi,
  helper
) {
  console.log('Entered main.js of ma_distproject extension');
  $(function() {

    var gdist_project_obj = {
      "id": 'DistProject1',
      "name": 'Alpha3',
      "owner": 'cristiananastasiu@googlemail.com',
      "description": 'This is my first demo project',
      "dmsteps": {}
    }

    var gdist_project_actions = {};

    $("#master-wizard").steps({
      headerTag: "h3",
      bodyTag: "section",
      transitionEffect: 1,
      autoFocus: true,
      saveState: true,
      onStepChanging: function(event, currentIndex, newIndex) {
        if(currentIndex == 0){
          /* Set the input values from 1st step into the global project object */
          gdist_project_obj['id'] = $('#gpid').val();
          gdist_project_obj['name'] = $('#gpname').val();
          gdist_project_obj['description'] = $('#gpdescription').val();
        }

        /* Look at which data mining steps were selected and show only these in step 3 */

        if (currentIndex == 1 && newIndex == 2) {
          /*
          var k = Object.keys(gdist_project_obj['dmsteps']);
          var o = Object.keys(data_mining_steps_labels);
          for (x in o) {
            if (k.indexOf(o[x]) != -1) {
              $(data_mining_steps_2[x]).show(200);
            } else {
              $(data_mining_steps_2[x]).hide(200);
            }
          }
          */

          $('#master-wizard-p-' + (currentIndex + 1)).append(accordion);

          $(".dropable ul").droppable({
            accept: "#action_list div ul li"
          }).sortable({
            receive: function(e, ui) {}
          }).disableSelection();

        }

        if (currentIndex == 2 && newIndex == 3) {

          var d = document.createElement('div');
          $(d).addClass('mining-step clearfix thin step3');
          var ds = document.createElement('div');
          $(ds).addClass('sbody');
          var t = document.createElement('span');
          $(t).html('All Actions')
          var acont = document.createElement('div')
          $(acont).addClass('acont');

          $(".sbody .dropable .action-item:visible").each(function(index) {
            $(acont).append($(this).clone());
          });


          $(ds).append(t);
          $(ds).append(acont);
          $(d).append(ds);
          $("#master-wizard-p-" + (currentIndex + 1)).html(d);

          var arr = document.createElement('div');
          $(arr).addClass('mining-step clearfix thin step3');

          var arr_a = document.createElement('a');
          $(arr_a).text('Append');
          $(arr_a).click(function() {
            console.log($('.acont .action-item').first());
            $('.acont .action-item').first().appendTo($('.assignment.aactive .aactions').first());
          });
          $(arr).append(arr_a);
          $("#master-wizard-p-" + (currentIndex + 1)).append(arr);

          var arr = document.createElement('div');
          $(arr).addClass('mining-step clearfix large step3');
          var newas = document.createElement('a');
          $(newas).text('new');

          $(newas).click(function(event) {
            var as = document.createElement('div');
            $(as).addClass('assignment');
            $(as).attr('tabindex', 1);
            var as_title = document.createElement('span');
            $(as_title).text('Assignment');
            $(as_title).addClass('atitle');
            var as_actions = document.createElement('div');
            $(as_actions).addClass('aactions');
            $(as_actions).attr('data-ph', 'Add actions ');
            var as_description = document.createElement('textarea');
            $(as_description).addClass('adescription');
            $(as_description).attr('placeholder', 'Enter assignment description');
            var as_owner = document.createElement('input');
            $(as_owner).addClass('ainput');
            $(as_owner).attr('placeholder', 'Enter owner email address');
            $(as).append(as_title, as_actions, as_description, as_owner);
            $(as).focus(function() {
              $(".aactive").each(function(index) {
                $(this).removeClass('aactive');
              });
              $(this).addClass('aactive');
            });

            $(as).focus();
            $(newas).before(as);
          })
          $(arr).append(newas);
          $("#master-wizard-p-" + (currentIndex + 1)).append(arr);


        }

        if (currentIndex == 3) {

          //console.log(gdist_project_actions);

          gdist_project_obj['bundles'] = [];
          $(".assignment").each(function(index) {
            var bundle = {};
            bundle['id'] = $(this).find(".atitle").first().text();
            //console.log(bundle['id']);
            bundle['description'] = $(this).find(".adescription").first().val();
            //console.log(bundle['description']);
            bundle['owner'] = $(this).find(".ainput").first().val();
            //console.log(bundle['owner']);

            var bactions = [];

            /*
            "name": 'importTableFromCSV',
            "description": 'Action will import data from a csv file. Arguments ...',
            "input": 'Text File in csv format',
            "output": 'pandas.Dataframe'
             */

            $(this).find('.aactions .action-item').each(function(index) {

              var baction = {};
              baction['id'] = $(this).attr('id');
              baction['name'] = gdist_project_actions[$(this).attr('id')].label;
              baction['input'] = gdist_project_actions[$(this).attr('id')].input;
              baction['output'] = gdist_project_actions[$(this).attr('id')].output;
              baction['description'] = gdist_project_actions[$(this).attr('id')].description;
              bactions.push(baction);

            });
            bundle['actions'] = bactions;
            gdist_project_obj['bundles'].push(bundle);

          });
          var pre = document.createElement('pre');
          $(pre).css('height','100%');
          $(pre).css('display','block');
          $(pre).css('overflow','scroll');
          $(pre).text(JSON.stringify(gdist_project_obj,null, 4));
          $('#master-wizard-p-' + (currentIndex + 1)).empty();
          $('#master-wizard-p-' + (currentIndex + 1)).append(pre);
          console.log(gdist_project_obj);
        }
        return true;
      },
      onFinishing : function (event, currentIndex) {
          createNB(gdist_project_obj);
          $("#master-wizard").remove();
      }
    });

    var createDataMiningSteps_1 = helper.createDataMiningSteps_1;

    var createDataMiningSteps_2 = helper.createDataMiningSteps_2;


    /* Create accordion */
    var accordion = helper.wizardActionAccordion;


    /* Create the data mining steps for wizard step 1 & 2 */
    var data_mining_steps_labels = {};
    var data_mining_steps_1 = [];
    var data_mining_steps_2 = [];

    $.ajax({
      url: "/steps",
      contentType: 'application/json,charset=UTF-8',
      type: 'GET',
      dataType: 'json'
    }).then(function(res) {
      for (x in res.items) {
        data_mining_steps_1.push(createDataMiningSteps_1(res.items[x].label, res.items[x].description, res.items[x]['_id']));
        data_mining_steps_2.push(createDataMiningSteps_2(res.items[x].label, res.items[x].description, res.items[x]['_id']));
        data_mining_steps_labels[res.items[x]['_id']] = res.items[x].label;
      }

      $("#master-wizard").steps('add', {
        title: "Project Information",
        content: '<input id="gpid" class="ainput" placeholder="Project ID"/><input id="gpname" class="ainput" placeholder="Project Name"/>'+
                 '<textarea id="gpdescription" class="adescription" placeholder="Enter project description" />'
      });

      $("#master-wizard").steps('add', {
        title: "Select steps",
        content: data_mining_steps_1
      });
      $("#master-wizard").steps('add', {
        title: "Add Actions",
        content: data_mining_steps_2
      });

      $("#master-wizard").steps('add', {
        title: "Group Assignments",
        content: ''
      });

      $("#master-wizard").steps('add', {
        title: "Summary",
        content: ''
      });
    });
  });





  var load_css = function(name) {
    var link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = require.toUrl(name);
    document.getElementsByTagName("head")[0].appendChild(link);
  };

  var i = gdapi.init;

  /* http://www.jquery-steps.com/Examples#vertical */


  /*
  then(
    function(res){
      console.log(res);
    },
    function(err){
      gdapi.file_create(t,p,mtype).then(
        function(val){
            console.log(val);
        },
        undefined
      );
    }
  )

  */
  /*
  $("#createNbButton").click (function(data){
    $.ajax({url: "/create"}).then(function(value){
        create_if_not_exists('IPython_Projects','root','application/vnd.google-apps.folder').then(
        function(fid){
            console.log('Create file: ' + helper.project.name + '  in parent + ' + fid);
            create_if_not_exists(helper.project.name,fid,'application/vnd.google-apps.folder').then(
              function(r){

                gdapi.file_insert('HelloWorld!','Test.txt',r).then(
                  function(res){
                    gdapi.file_inserPermission(res.id,'cristiananastasiu@gmail.com', 'user','writer');
                  },
                  function(err){
                    console.log(err);
                  }
                );
              },
              function (err){
                console.log(err);
              }
            );
        },
        function(err){
          alert("Ooops ... Error");
        });
    });
  });


  */
  // 0B79xfDa9qVy1SFRpZ29pangwbHM
  $("#mergeNotebook").click(
    function(data) {
      $.ajax({
        url: "/distprojects/" + $("#notebook_id").val(),
        contentType: 'application/json,charset=UTF-8',
        type: 'GET',
        dataType: 'json'
      }).then(function(res) {
        promises = [];
        for (i = 0; i < res.bundles.length; i++) {
          promises.push(gdapi.file_get_notebook(res.bundles[i].gid));
        }
        master_nb = {
          cells: [],
          nbformat: 4,
          nbformat_minor: 0,
          metadata: {}
        }
        Promise.all(promises).then(function(results) {
          for (var x in results) {
            for (var y in results[x].cells) {
              master_nb['cells'].push(results[x].cells[y]);
            }

          }
          console.log(master_nb);
          gdapi.file_insert(JSON.stringify(master_nb), 'master.ipynb', res.gid);
        });

      });
    });


  $("#getFileButton").click(function(data) {
    gdapi.file_get_notebook('0B79xfDa9qVy1UkZMbjNmWnk1NVk').then(function(result) {
      console.log(result);
    });
  });


  // Function calling a sequence of asnyc calls to the Google Drive API's
  var createNB = function(nb) {
    $.ajax({
      url: "/distprojects/convert",
      data: JSON.stringify(nb),
      contentType: 'application/json,charset=UTF-8',
      type: 'POST',
      dataType: 'json'
    }).then(
      function(nb) {
        //console.log(nb);
        p_succ = [];
        new Promise(function(resolve, reject) {
          /* Check if we have the IPython root folder - IPython_Projects. If not, create*/
          gdapi.file_create_if_not_exists('IPython_Projects', 'root', 'application/vnd.google-apps.folder').then(
            function(res) {
              /* Check if we have the IPython project folder. If not, create. */
              gdapi.file_create_if_not_exists(nb.name, res, 'application/vnd.google-apps.folder').then(
                function(pr_fid) {
                  nb.gid = pr_fid;
                  /* Inserting file a specified location */
                  gdapi.file_inserPermission(pr_fid, nb.owner, 'user', 'writer').then(
                    function() {
                      var promises = [];
                      for (i = 0; i < nb.bundles.length; i++) {
                        promises.push(gdapi.file_insert(nb.bundles[i].notebook, i + '_' + nb.bundles[i].id + '.ipynb', pr_fid));
                      }
                      Promise.all(promises).then(
                        function(r) {
                          var perm_promises = [];
                          for (j = 0; j < r.length; j++) {
                            /* Give write access to his task */
                            nb.bundles[j].gid = r[j].id
                            perm_promises.push(gdapi.file_inserPermission(r[j].id, nb.bundles[j].owner, 'user', 'writer'));
                            perm_promises.push(gdapi.file_inserPermission(pr_fid, nb.bundles[j].owner, 'user', 'reader'));
                          }
                          Promise.all(perm_promises).then(resolve);
                        }
                      );
                    }, reject
                  );
                }, reject
              );
            },
            function(reason) {
              console.log(reason);
              reject(reason);
            }
          );
        }).then(function() {
          /* Save project in MongoDB */
          console.log(nb);
          $.ajax({
            url: "/distprojects",
            data: JSON.stringify(nb),
            contentType: 'application/json,charset=UTF-8',
            type: 'POST',
            dataType: 'json'
          });

          $("#notebook_id").val(nb.gid);


        }, function() {

          /* Rollback function, deleting the project if we made it so far */
          console.log('Entering rollback.');
          if (nb.gid) {
            console.log('Deleting project id ' + nb.gid);
            gdapi.file_delete(nb.gid).then(
              function(result) {
                console.log('Project was deleted.');
              },
              function(reason) {
                console.log(reason);
              }
            );
          }
        });
      }
    );
  };

  $("#createNbButton").click();

});


/*

  var data = [{
    label: 'node1',
    children: [{
      label: 'child1'
    }, {
      label: 'child2'
    }]
  }, {
    label: 'node2',
    children: [{
      label: 'child3'
    }]
  }];


  $(function() {
    $('#tree').tree({
      data: data,
      selectable: false,
      onCanSelectNode: true
    });
  });

*/
