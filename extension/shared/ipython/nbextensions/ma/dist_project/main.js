require([
    'base/js/namespace',
    'base/js/utils',
    'base/js/events',
    'jquery',
    'require',
    'contents',
    'services/config',
    'nbextensions/ma/dist_project/tree.jquery.js',
    'nbextensions/gdrive/gapi_utils',
    'nbextensions/ma/dist_project/gdapi',
    'nbextensions/ma/dist_project/dist_project_helper',
    'jqueryui'
], function(
    IPython,
    utils,
    events,
    $,
    require,
    contents,
    configmod,
    tree,
    gapiutils,
    gdapi,
    helper
    ){
      console.log('Entered main.js of ma_distproject extension');

      var data = [
          {
              label: 'node1',
              children: [
                  { label: 'child1' },
                  { label: 'child2' }
              ]
          },
          {
              label: 'node2',
              children: [
                  { label: 'child3' }
              ]
          }
      ];

      $(function() {
          $('#tree1').tree({
              data: data,
              selectable: false,
              onCanSelectNode : true
          });
      });

      $( "#tree1 span" ).draggable({
          connectToSortable: ".connectedSortable",
          forcePlaceholderSize: false,
          helper: "clone"
      }).disableSelection();

      $(".connectedSortable").droppable ({
              accept: "#tree1 span"
      }).sortable({
        receive: function(e,ui) {

        }
      }).disableSelection();


      var load_css = function (name) {
          var link = document.createElement("link");
          link.type = "text/css";
          link.rel = "stylesheet";
          link.href = require.toUrl(name);
          document.getElementsByTagName("head")[0].appendChild(link);
        };
      load_css('/nbextensions/ma/dist_project/jqtree.css');





      var i = gdapi.init;

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
      $("#mergeNotebook").click (
        function(data){
        $.ajax({url: "/distprojects/0B79xfDa9qVy1aE4wQzdhSmtlMWM",
        contentType: 'application/json,charset=UTF-8',
        type : 'GET',
        dataType: 'json'}).then(function(res){
          promises = [];
          for(i = 0; i < res.bundles.length; i++){
            promises.push(gdapi.file_get_notebook(res.bundles[i].gid));
          }
          master_nb = {
            cells : [],
            nbformat: 4,
            nbformat_minor: 0,
            metadata : {}
          }
          Promise.all(promises).then(function(results){
              for (var x in results){
                for (var y in results[x].cells){
                    master_nb['cells'].push(results[x].cells[y]);
                }

              }
              console.log(master_nb);
              gdapi.file_insert(JSON.stringify(master_nb),'master.ipynb',res.gid);
          });

        });
      });


      $("#getFileButton").click (function(data){
        gdapi.file_get_notebook('0B79xfDa9qVy1UkZMbjNmWnk1NVk').then(function(result){
          console.log(result);
        });
      });

      $("#createNbButton").click (function(data){
        $.ajax({url: "/distprojects/convert", data: JSON.stringify(helper.project),
        contentType: 'application/json,charset=UTF-8',
        type : 'POST',
        dataType: 'json'}).then(
          function(nb){
            //console.log(nb);
            p_succ = [];
            new Promise(function (resolve, reject) {
                  /* Check if we have the IPython root folder - IPython_Projects. If not, create*/
                  gdapi.file_create_if_not_exists('IPython_Projects','root','application/vnd.google-apps.folder').then(
                    function(res){
                        /* Check if we have the IPython project folder. If not, create. */
                        gdapi.file_create_if_not_exists(nb.name,res,'application/vnd.google-apps.folder').then(
                            function(pr_fid){
                                nb.gid = pr_fid;
                                /* Inserting file a specified location */
                                gdapi.file_inserPermission(pr_fid,nb.owner, 'user','writer').then(
                                  function(){
                                    var promises = [];
                                    for (i = 0; i < nb.bundles.length; i++) {
                                      promises.push(gdapi.file_insert(nb.bundles[i].notebook,i+'_'+nb.bundles[i].id+'.ipynb',pr_fid));
                                    }
                                    Promise.all(promises).then(
                                      function(r){
                                        var perm_promises =[];
                                        for(j = 0; j < r.length; j++){
                                          /* Give write access to his task */
                                          nb.bundles[j].gid = r[j].id
                                          perm_promises.push(gdapi.file_inserPermission(r[j].id,nb.bundles[j].owner, 'user','writer'));
                                          perm_promises.push(gdapi.file_inserPermission(pr_fid,nb.bundles[j].owner, 'user','reader'));
                                        }
                                        Promise.all(perm_promises).then(resolve);
                                      }
                                    );
                                  },reject
                                );
                              },reject
                            );
                          },
                          function(reason){
                            console.log(reason);
                            reject(reason);
                          }
                      );
                  }).then(function(){
                    /* Save project in MongoDB */
                    console.log(nb);
                    $.ajax({url: "/distprojects", data: JSON.stringify(nb),
                    contentType: 'application/json,charset=UTF-8',
                    type : 'POST',
                    dataType: 'json'});

                  }, function(){

                    /* Rollback function, deleting the project if we made it so far */
                    console.log('Entering rollback.');
                    if(nb.gid){
                      console.log('Deleting project id ' + nb.gid);
                      gdapi.file_delete(nb.gid).then(
                        function(result){
                          console.log('Project was deleted.');
                        },
                        function(reason){
                          console.log(reason);
                        }
                      );
                    }
                  });
                }
            );
        });

});
