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
        "name":         'Alpha2',
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
            "owner": 'cristiananastasiu@gmail.com',
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

  });
