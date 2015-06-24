var button = chrome.browserAction;

button.onClicked.addListener(function(){
	chrome.tabs.create({url:'http://theoldreader.com/posts/all'});
});

var timeout = null;

var Failure = function(error) {
	if (timeout !== null) return;
	current_status = 'failure';
	button.setBadgeText({text:" ? "});
	button.setIcon({path:"icon-inactive.png"});
	button.setTitle({title:'The Old Reader\n\n' + error});
	timeout = setTimeout(function() { Update(); }, 30000);
};


var Success = function(feedData) {
	if (timeout !== null) return;
	var s = 'The Old Reader\n';
	var count = 0;
	var i, folder;
	for (i = 0; folder = feedData.feeds[i]; i++) {
	  var k, feed;
	  for (k = 0; feed = folder.feeds[k]; k++) {
	    if (feed.unread_count) {
	      s += '\n' + feed.title + ': ' + feed.unread_count;
	      count += feed.unread_count;
	    }
	  }
	}
	for (i = 0; folder = feedData.following[i]; i++) {
	  if (folder.unread_count) {
	    count += folder.unread_count;
	  }
	}
	
	button.setBadgeText({text:(count==0?'':''+count)});
	button.setIcon({path:"icon-active.png"});
	button.setTitle({title:s});
	timeout = setTimeout(function() { Update(); }, 60000);
};


var Update = function() {
	if (timeout !== null) { clearTimeout(timeout); timeout = null; }
	current_status = 'updating';
	var httpRequest = new XMLHttpRequest();
	var requestTimeout = window.setTimeout(function() {
	  httpRequest.abort();
	  Failure('Error communicating with the server. Request timed out.');
	}, 20000);
	httpRequest.onerror = function() { Failure('Error communicating with the server.'); };
	httpRequest.onreadystatechange = function() {
	  if (httpRequest.readyState == 4) {
	    window.clearTimeout(requestTimeout);
	    if (httpRequest.status == 401) {
	      Failure('You are not logged in.');
	    } else if (httpRequest.status >= 400) {
	      Failure('Error communicating with the server. HTTP status ' + httpRequest.status + '.');
	    } else if (httpRequest.responseText) {
	      var feedData = {
	      };
	      try {
	        feedData = JSON.parse( httpRequest.responseText );
	        Success(feedData);
	      } catch (exception) {
	        Failure('Error communicating with the server. Invalid server response.');
	      }
	    } else {
	      Failure('Error communicating with the server. Invalid server response.');
	    }
	  }
	};
	try {
	  httpRequest.open('GET', 'http://theoldreader.com/feeds/counts.json', true);
	  httpRequest.send(null);
	} catch (exception) {
	  Failure('Error communicating with the server.');
	}
};

Update();

