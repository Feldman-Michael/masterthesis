$([IPython.events]).on('notebook_loaded.Notebook', function(){

    require(['custom/importv'], function(custom){
        window.display_variables = custom.display_variables;
    } );
});
