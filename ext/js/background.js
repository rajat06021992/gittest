function randomID(length) {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for (var i = 0; i < length; i++)
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	return text;
}
function reload(){
	$.get(chrome.extension.getURL('config.json'), function(settings) {
		if(typeof settings!=='object')settings=JSON.parse(settings);
		chrome.windows.getAll({populate:true},function(windows){
		  windows.forEach(function(window){
			 window.tabs.forEach(function(tab){
				 for(var i=0;i<settings[settings.active.mode].app.url.length;i++){
					 if(tab.url.indexOf(settings[settings.active.mode].app.url[i])>-1){
						 chrome.tabs.reload(tab.id);
						 break;
					 }
				 }
			 });
		  });
		});
	});
}

var user_id_anon = localStorage.getItem('user_id_anon') ? localStorage.getItem('user_id_anon') : randomID(32);
localStorage.setItem('user_id_anon', user_id_anon);

chrome.runtime.onInstalled.addListener(function(details){
	reload();
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

	// __ext_runtime_user_anon_register
	if (request.greeting == 'hello') {
		var user_id_anon = localStorage.getItem('user_id_anon') ? localStorage.getItem('user_id_anon') : randomID(32);
		localStorage.setItem('user_id_anon', user_id_anon);
		sendResponse({
			data: {
				user_id_anon: user_id_anon
			}
		});

	// __ext_runtime_browser_page_reload
	} else if(request.greeting === 'reload'){
		reload();
	}
	// __ext_runtime_user_anon_login
	else if (request.greeting === 'login') {
		localStorage.setItem('user_id_registered', request.data.user_id_registered);
		var loggedIn = false;
		var response = {};
		response.user_id_anon = localStorage.getItem('user_id_anon') ? localStorage.getItem('user_id_anon') : randomID(32);
		if (localStorage.getItem('user_id_registered') && localStorage.getItem('user_id_registered').length) {
			loggedIn      = true;
			response.user_id_registered = localStorage.getItem('user_id_registered');
		}
		response.loggedIn = loggedIn;
		sendResponse({
			data: response
		});

	// __ext_runtime_user_anon_login_is
	} else if (request.greeting === 'isLoggedIn') {
		var loggedIn = false;
		var response = {};
		response.user_id_anon = localStorage.getItem('user_id_anon') ? localStorage.getItem('user_id_anon') : randomID(32);
		if (localStorage.getItem('user_id_registered') && localStorage.getItem('user_id_registered').length) {
			loggedIn      = true;
			response.user_id_registered = localStorage.getItem('user_id_registered');
		}
		response.loggedIn = loggedIn;
		sendResponse({
			data: response
		});

	// __ext_runtime_user_anon_logout
	} else if (request.greeting === 'logout') {
		localStorage.removeItem('user_id_registered');
		var loggedIn = false;
		var response = {};
		response.user_id_anon = localStorage.getItem('user_id_anon') ? localStorage.getItem('user_id_anon') : randomID(32);
		if (localStorage.getItem('user_id_registered') && localStorage.getItem('user_id_registered').length) {
			loggedIn      = true;
			response.user_id_registered = localStorage.getItem('user_id_registered');
		}
		response.loggedIn = loggedIn;
		sendResponse({
			data: response
		});

	// __ext_runtime_user_user_id_anon_set
	} else if (request.greeting === 'impose') {
		localStorage.setItem('user_id_anon', request.user_id_anon);

	// __ext_runtime_moment_new
	} else if (request.greeting === 'moment_create_notification'){
		console.log(request.items);
		if(request.items.length==0)return;
		var items=[];
		for(var i=0;i<request.items.length;i++){
			items.push({title:request.items[i].title,message:''});
		}
		console.log(items);
		chrome.notifications.create(
		    randomID(),{
		    type: 'list',
		    iconUrl: 'images/ext_notification_icon.png',
		    title: 'Added to sticky remix:',
		    message: '',
			 items:items
		    },

		function() {}

		);
	}
	return true;
});
