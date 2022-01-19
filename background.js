async function getCurrentTab() {
	let queryOptions = { active: true, currentWindow: true };
  	let [tab] = await chrome.tabs.query(queryOptions);
  	return tab;
}

chrome.runtime.onMessage.addListener((data, sender, sendResponse) => {
	if (data.type === 'login') {
		// sign in process
		// calling fetch request
		login(data.payload)
            .then(res => {
				if (res === 'login fail') {
					sendResponse('login fail');
				}      	
            })
            .catch(err => console.log('on message request send failed',err));
        return true;
	} else if (data.type === 'signup') {
		signup(data.payload)
			.then(res => {
            	console.log("on message request send success", res);   
				if (res.username || res.password || res.password2 || res.email) {
					console.log('signup failed!!!')
					sendResponse(res);
				}            	
            })
            .catch(err => console.log('on message request send failed', err));
		return true;
	} else if (data.type === 'checklogin') {
		token = '';
		readLocalStorage('hlData')
		    .then(res => {
		    	if(res !== 'fail') {
		    		return (res)
		    	} else {
		    		chrome.tabs.create({'url': 'popup-sign-in.html'}, function(tab) {});
		    	}
		    })
			.then (access_token => {
				return post_quote(access_token, data.message, data.url, data.tag);
			})
        	.then (res => {
        		if (res.status == 201) {
        			// active login, can send quote
        			console.log("successfully posted");
					createPopupNode(data.message);
        		}
        		else {
        			//notify("fail posted");
        		}
        	})
		    .catch(err => {
		    	//notify(err)
		    });
		return true;
	}
});

chrome.runtime.onInstalled.addListener( () => {
	chrome.contextMenus.create({
		id: 'notify',
		title: "Notify!: %s",
		contexts: ["selection"]
	});
});

chrome.contextMenus.onClicked.addListener( ( info, tab ) => {
	if ('notify' === info.menuItemId) {
		notify(info.selectionText);
	}
});

const notify = message => {
	chrome.storage.local.get(['notifyCount'], data => {
		let value = data.notifyCount || 0;
		chrome.storage.local.set({
			'notifyCount': Number(value) + 1
		});
	});

	return chrome.notifications.create(
		'',
		{
			type: 'basic',
			title: 'Notify!',
			message: message || 'Notify!',
			iconUrl: 'small.jpg',
		}
	)
};

function signup(user_info) {
	return fetch('https://hili-app.herokuapp.com/auth/register/', 
		{
	        method: 'POST',
	        headers: {'Content-Type': 'application/json'
	        },
	        body: JSON.stringify({
	        	"username":user_info.username,
	        	"password":user_info.password,
	        	"password2":user_info.password2,
	        	"email":user_info.email,
	        	"first_name":"",
	        	"last_name":""
	        })
    })
		.then(res => res.json())
		.then(data => {
			if (data.tokens) {
				return new Promise(resolve => {     
					console.log('resolve fail')
					if (data.tokens.access) {
						access_token = data.tokens.access;
						refresh_token = data.tokens.refresh
						getCurrentTab()
							.then(result => {chrome.tabs.remove(result.id, function() { });})
							.catch(err => console.log(err));
						chrome.storage.local.get(['hlData'], data => {
							let access_value = access_token || 0;
							let refresh_value = refresh_token || 0;
							chrome.storage.local.set({
								'hlData': access_value,
								'hlRefresh': refresh_value
							});
						});
					} else {
						console.log(data);
						resolve('signup fail')
					}	
				})
			}
			else if (data.username || data.password || data.password2 || data.email) {
				return new Promise(resolve => {
					console.log('resolve signup fail')
					resolve(data)
				})
			}
		})
	    .catch(err => {
			console.log(err)
			return('signup fail')
		});
}



function login(user_info) {
    return fetch('https://hili-app.herokuapp.com/auth/login/', 
       	{
	        method: 'POST',
	        mode: 'cors',
	        headers: {'Content-Type': 'application/json'
	        },
	        body: JSON.stringify({"username":user_info.username,
	        	   "password":user_info.password
	        })
        })
        	.then(res => res.json())
        	.then(data => {
        		return new Promise(resolve => {                    
                    if (data.access) {

                    	access_token = data.access;
                    	refresh_token = data.refresh
                    	getCurrentTab()
                    		.then(result => {chrome.tabs.remove(result.id, function() { });})
                    		.catch(err => console.log(err));

                    	// currently storing access token
                    	// should store also refresh token 
                    	// and use refresh token to refresh?
                    	chrome.storage.local.get(['hlData'], data => {
							let access_value = access_token || 0;
							let refresh_value = refresh_token || 0;
							chrome.storage.local.set({
								'hlData': access_value,
								'hlRefresh': refresh_value
							});
						});
					} else {
                    	resolve('login fail');
                    }
						
                })
        	})
            .catch(err => console.log(err));

}


function post_quote(token, message, url, tag) {
	return fetch('https://hili-app.herokuapp.com/modules/quotes/', 
						{
					        method: 'POST',
					        headers: {'Authorization': 'Bearer ' + token,
					        		  'Content-type': 'application/json'
					        },
							body: JSON.stringify(
								{	
									date: new Date().toISOString().slice(0, 10),
									url: url,
									quote: message,
									tag: tag}
							),
				        }
				    )
}


function check_login_status(access_token) {
	return fetch('https://hili-app.herokuapp.com/modules/users/', 
				{
				    method: 'GET',
				    headers: {'Authorization': 'Bearer ' + access_token,
				       		  'Content-type': 'application/json'
				    },
				}
			)
}


const readLocalStorage = (key) => {
    return new Promise((resolve, reject) => {
		chrome.storage.local.get([key], function (result) {
			if (result[key] === undefined) {
				resolve('fail');
			} else {
				resolve(result[key]);
			}
      	});
    });
};

function createPopupNode(selectedText) {
	chrome.storage.local.get(['latestQuote'], data => {
		let value = data.latestQuote || 0;
		chrome.storage.local.set({
			'latestQuote': selectedText
		});
	});
}