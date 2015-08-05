define(['exports'], function (exports) {
    //Do setup work here

      exports.load_css =  function(name){
            var link = document.createElement("link");
            link.type = "text/css";
            link.rel = "stylesheet";
            link.href = require.toUrl(name);
            console.log(link);
            document.getElementsByTagName("head")[0].appendChild(link);

        };

      exports.load_js = function (name) {
        var script = document.createElement("script");
        //script.type = "text/javascript";
        script.charset = "utf-8";
        script.src = require.toUrl(name);
        console.log(script);
        document.getElementsByTagName("head")[0].appendChild(script);
      }

      exports.uniqueid = function(){
        // always start with a letter (for DOM friendlyness)
        var idstr=String.fromCharCode(Math.floor((Math.random()*25)+65));
        do {
          // between numbers and characters (48 is 0 and 90 is Z (42-48 = 90)
          var ascicode=Math.floor((Math.random()*42)+48);
          if (ascicode<58 || ascicode>64){
            // exclude all chars between : (58) and @ (64)
            idstr+=String.fromCharCode(ascicode);
          }
        } while (idstr.length<32);

        return (idstr);
      }

      exports.existingComments = [
        {
          "sectionId": "T2PJ0DAD4IFFBN3ONA7NQ0J75247D83R",
          "comments": [
            {
              "authorAvatarUrl": "",
              "authorName": "Jon Sno",
              "comment": "I'm Ned Stark's bastard. Related: I know nothing."
            },
            {
              "authorAvatarUrl": "",
              "authorName": "Donald Draper",
              "comment": "I need a scotch."
            }
          ]
        },
        {
          "sectionId": "3",
          "comments": [
            {
              "authorAvatarUrl": "",
              "authorName": "Senator Clay Davis",
              "comment": "These Side Comments are incredible. Sssshhhiiiiieeeee."
            }
          ]
        }
      ];

});
