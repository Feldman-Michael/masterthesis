define(
  [
    "require",
    "exports",
    'jquery',
    'base/js/utils'
  ],
  function(require, exports, $, utils) {

    exports.project =
      {
        "id":           'DistProject1',
        "name":         'Alpha3',
        "owner":        'cristiananastasiu@googlemail.com',
        "description":  'This is my first demo project',
        "bundles":      [
          {
            "id": 'task1',
            "description": 'First task',
            "owner": 'cristiananastasiu@googlemail.com',
            "actions": [
              {
                "id": 'action1',
                "name": 'importTableFromCSV',
                "description": 'Action will import data from a csv file. Arguments ...',
                "input": 'Text File in csv format',
                "output": 'pandas.Dataframe'
              },
              {
                "id": 'action2',
                "name": 'removeNullValuesFromDF',
                "description": 'Action will remove rows which contain Null or NA values.',
                "input": 'pandas.Dataframe',
                "output": 'pandas.Dataframe'
              }
            ]

          },
          {
            "id": 'task2',
            "description": 'Second task',
            "owner": 'michael.feld86@gmail.com',
            "actions": [
              {
                "id": 'action3',
                "name": 'plotDF',
                "description": 'Action will import data from a csv file. Arguments ...',
                "input": 'Text File in csv format',
                "output": 'pandas.Dataframe'
              }
            ]
          }

        ]
    };

    exports.wizardActionAccordion = function(){
      var accordion = document.createElement('div');
      $(accordion).attr('id', 'action_list').css('float', 'right');
      $.ajax({
        url: "/actions/category",
        contentType: 'application/json,charset=UTF-8',
        type: 'GET',
        dataType: 'json'
      }).then(function(res) {
        /* Reset the global action array */
        gdist_project_actions = {};
        for (x in res) {
          $(accordion).append('<h2>' + x + '</h2>');
          var d = document.createElement('div');
          var u = document.createElement('ul');
          for (y in res[x]) {

            /* Push actions in the g array */
            gdist_project_actions[res[x][y]['_id']] = res[x][y];
            l = document.createElement('li');
            $(l).append('<div class="action-item" id="' + res[x][y]['_id'] + '">' + res[x][y]['label'] + '<div>');
            $(l).draggable({
              connectToSortable: ".dropable ul",
              forcePlaceholderSize: false,
              helper: "clone"
            }).disableSelection();
            $(u).append(l);
          }
          $(d).append(u);
          $(accordion).append(d);
        }

        $(accordion).accordion({
          header: "h2",
          heightStyle: "content",
          collapsible: true
        });

      });
      return accordion;
    }

    exports.createDataMiningSteps_1 = function(label, description, id) {
      var s1 = document.createElement('div');
      $(s1).attr('id', id);
      $(s1).addClass('mining-step clearfix unselected')
      var sbody = document.createElement('div');
      $(sbody).addClass('sbody').append('<span>' + label + '</span>').append('<span class="desc">' + description + '</span>');
      var saction = document.createElement('div');
      var asaction = document.createElement('a');
      $(asaction).html('Select');
      $(asaction).attr('href', '#');
      $(saction).addClass('saction').append(asaction);

      $(saction).click(function() {
        if ($(s1).hasClass('unselected')) {
          $(s1).removeClass('unselected');
          $("#"+$(s1).attr('id')+".thin").show();
          $(asaction).html('Unselect');
          gdist_project_obj['dmsteps'][id] = label;
          //console.log(gdist_project_obj);
        } else {
          $(s1).addClass('unselected');
          $(asaction).html('Select');
          $("#"+$(s1).attr('id')+".thin").hide();
          delete gdist_project_obj['dmsteps'][id];
          //console.log(gdist_project_obj);
        }
      });
      $(s1).append(sbody).append(saction);
      return s1;
    }

    exports.createDataMiningSteps_2 = function(label, description, id) {
      var s1 = document.createElement('div');
      $(s1).attr('id', id);
      $(s1).addClass('mining-step clearfix thin'); //.css('display', 'none');
      var sbody = document.createElement('div');
      $(sbody).addClass('sbody').append('<span>' + label + '</span>');

      dropable = document.createElement('div');
      $(dropable).append('<ul></ul>');
      $(dropable).addClass('dropable')
      $(sbody).append(dropable);
      $(s1).append(sbody);
      $(s1).hide();
      return s1;
    }

  });
