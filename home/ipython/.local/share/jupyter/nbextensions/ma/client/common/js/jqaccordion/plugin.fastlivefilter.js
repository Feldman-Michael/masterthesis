/**
 * Plugin for filtering lists in realtime through an input field.
 * Downloaded from https://github.com/awbush/jquery-fastLiveFilter
 * Modified by Cristian Anastasiu to filter an accordion object provided
 * by the multilevel.accordion plugin.

 * @module plugin.fastLiveFilter
 * @author Anthony Bush
 */



jQuery.fn.fastLiveFilter = function(list, options) {
	// Options: input, list, timeout, callback
	options = options || {};
	list = jQuery(list);
	var input = this;
	var lastFilter = '';
	var timeout = options.timeout || 0;
	var callback = options.callback || function() {};

	var keyTimeout;

	// NOTE: because we cache lis & len here, users would need to re-init the plugin
	// if they modify the list in the DOM later.  This doesn't give us that much speed
	// boost, so perhaps it's not worth putting it here.
	var lis = list.children('li');
	var len = lis.length;
	var oldDisplay = len > 0 ? lis[0].style.display : "block";
	callback(len); // do a one-time callback on initialization to make sure everything's in sync

	input.change(function() {
		// var startTime = new Date().getTime();
		var filter = input.val().toLowerCase();
		var numShown = 0;
    var rec_filter = function(_lis){
      var li, innerText, atext;
			//console.log(filter);

      for (var i = 0; i < _lis.length; i++) {
        li = _lis[i];
        innerText = !options.selector ?
          (li.textContent || li.innerText || "") :
          $(li).find(options.selector).text();
        atext = $(li).children('a').text()

        if (innerText.toLowerCase().indexOf(filter) != -1) {
          if (li.style.display == "none") {
            li.style.display = oldDisplay;
          }

					if(!(atext.toLowerCase().indexOf(filter) != -1)){
            if($(li).children('ul').length > 0){
              var u = $(li).children('ul').first();
              rec_filter($(u).children('li'));
            }
          }
					else{
						$(li).find('li').css('display', oldDisplay);
					}

          numShown++;
        } else {
          if (li.style.display != "none") {
            li.style.display = "none";
          }
        }
      }
    }
    rec_filter(lis);
		callback(numShown);
		// var endTime = new Date().getTime();
		// console.log('Search for ' + filter + ' took: ' + (endTime - startTime) + ' (' + numShown + ' results)');
		return false;
	}).keydown(function() {
		clearTimeout(keyTimeout);
		keyTimeout = setTimeout(function() {
			if( input.val() === lastFilter ) return;
			lastFilter = input.val();
			input.change();
		}, timeout);
	});
	return this; // maintain jQuery chainability
}
