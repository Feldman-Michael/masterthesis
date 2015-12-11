define(function(){
var display_variables = function(id,element){
var request = gapi.client.drive.files.get({
          'fileId': '0B79xfDa9qVy1YVp0ajdfQUZrdEk'
});
request.execute(function(file) {
          if (file.downloadUrl && file.fileExtension === 'ipynb') {
            var accessToken = gapi.auth.getToken().access_token;
            var xhr = new XMLHttpRequest();
            xhr.open('GET', file.downloadUrl);
            xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
            xhr.onload = function() {
              //console.log(JSON.parse(xhr.responseText));
              var res = (JSON.parse(xhr.responseText));
                for(var j in res.cells){
                    element.append(res.cells[j].source);
                }
            };
            xhr.onerror = function() {
              reject();
            };
            xhr.send();
          }
});
}

return {
        display_variables : display_variables
    }

});



