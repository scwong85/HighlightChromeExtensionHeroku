chrome.storage.onChanged.addListener(function (changes, namespace) {
	for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
	  console.log(
		`Storage key "${key}" in namespace "${namespace}" changed.`,
		`Old value was "${oldValue}", new value is "${newValue}".`
	  );

	  if (key === 'latestQuote' && newValue !== undefined) {
		displayTooltip(selectedX, selectedY)

		var timeleft = 1;
		var downloadTimer = setInterval(function() {
			if (timeleft <= 0) {
				clearInterval(downloadTimer);
				removeTooltip()
			}
			timeleft -= 1;
			
	
		}, 1000);
	  }
    }
});

var selectedX = 0;
var selectedY = 0;

document.onclick = triggerPopup;

console.log('content script running', window.localStorage.getItem('hl_access'))

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



function triggerPopup(e) {
	clearPreviousPopupNode();

	var selectedText = window.getSelection().toString();
	if(selectedText.length > 0) {
		selectedX = e.pageX;
		selectedY = e.pageY;
		log = `Position: (${e.pageX}, ${e.pageY})`;
		console.log(log, selectedText, window.location.href, new Date());
		createPopupNode(e.pageX, e.pageY, selectedText);
		
	}
};

function clearPreviousPopupNode() {
	var element = document.getElementById("hlBlock");
	if(element != null) {
		element.remove();
	}
};

function createPopupNode(x, y, selectedText){

	var iDiv = document.createElement('div');
	iDiv.id = 'hlBlock';
	iDiv.className = 'hlBlock';

	iDiv.style.display = "block";
	iDiv.style.position = "absolute";
	iDiv.style.background = "white";
	iDiv.style.width = "310px";
	iDiv.style.height = "80px";
	iDiv.style.left = x + "px";
	iDiv.style.top = y + "px";
	iDiv.style.border = '1px solid #00000024';
	iDiv.style.boxShadow = "3px 3px #0000003b" ;

	var textDiv = document.createElement('div');
	textDiv.innerHTML = 'Save quotes to color tag';
	textDiv.style.textAlign = 'center';
	textDiv.style.fontFamily = 'monospace';
	iDiv.appendChild(textDiv);

	// create different color
	let color_arrays = ['red', 'yellow', 'blue', 'green', 'purple']
	for(let i=0; i<5; i++) {
		let colorTag = color_arrays[i];
		var innerDiv = document.createElement('div');
		innerDiv.className = 'color-tag';
		innerDiv.id = colorTag;
		innerDiv.style.backgroundImage = "linear-gradient(to bottom right, " + color_arrays[i] + ", transparent)";
		innerDiv.style.position = "absolute";
		let colorWidth = 50;
		innerDiv.style.width = "50px";
		innerDiv.style.height = "50px";
		innerDiv.style.borderRadius = "50%";
		let left_position = (i*colorWidth) + (i*10) + 10
		innerDiv.style.left = left_position + "px"; //10, 70, 130, 190, 250
		innerDiv.style.top = "20px";
		innerDiv.style.display = "block";
		innerDiv.style.boxShadow = "3px 3px #0000003b" 

		innerDiv.addEventListener("click", clickedFunc, false);
		iDiv.appendChild(innerDiv);
	}


	var access_token = 0;
	var refresh_token = 0;
	
	// Should check if access token exists
	// Then check if it is still active
	// If not active, call for refresh
	// If not exists, call for login
	readLocalStorage('hlData')
		.then(res => {
			if(res !== "fail") {
				access_token = res;
				return res
			} else {
				return -1
			}
		})
		.then(token => {
			if(token !== -1) {
				return readLocalStorage('hlRefresh')
			} else {
				return -1
			}
		})
		.then(token => {
			if(token !== -1) {
				refresh_token = token
				return check_login_status(access_token)
			} else {
				return "no token";
			}
		})
		.then(res => {
			if(res.status === 200) {
				console.log("login active"); // do nothing
				return "{1}"
			} else if(res === "no token") {
				console.log("no token"); // open login
				return "{1}"
			} else if(res.status === 401){
				console.log("login inactive", refresh_token); // refresh
				return refresh_login(refresh_token);
			} else {
				console.log("others"); // open login
				return "{1}"
			}
		})
		.then (res => res.json())
		.then(data => {
	    	if(data.access) {
	    		access_token = data.access;
                refresh_token = data.refresh;
	    		chrome.storage.local.get(['hlData'], data => {
						let access_value = access_token || 0;
						let refresh_value = refresh_token || 0;
						chrome.storage.local.set({
							'hlData': access_value,
							'hlRefresh': refresh_value
						});
					});
	    		console.log("refresh success");
	    		return "success"
	    	} else {
	    		console.log("refresh fail");
	    		return "fail"
	    	}
		})
		.catch(err => {console.log(err)});


	
	function refresh_login(refresh_token) {
		return fetch('https://hili-app.herokuapp.com/auth/login/refresh/', 
						{
					        method: 'POST',
					        headers: {'Content-type': 'application/json'
					        },
							body: JSON.stringify(
								{	
									refresh: refresh_token}
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

	function clickedFunc() {
		// Check login status at background.js
		// needed to do in background.js to use chrome.create function
		chrome.runtime.sendMessage({
						type: 'checklogin',
						message: selectedText,
						url: document.URL,
						tag: this.id,
					});


		var element = document.getElementById("hlBlock");
		element.remove();
	}

	// Then append the whole thing onto the body
	document.getElementsByTagName('body')[0].appendChild(iDiv);
};

const displayTooltip = (x, y) => {
	var iDiv = document.createElement('div');
	iDiv.id = 'quotetooltip';
	iDiv.className = 'quotetooltip';
	iDiv.style.display = "block";
	iDiv.style.position = "absolute";
	iDiv.style.background = "yellow";
	iDiv.style.width = "150px";
	iDiv.style.height = "20px";
	iDiv.style.left = x + "px";
	iDiv.style.top = y + "px";
	iDiv.innerHTML = 'Quote Saved!'
	iDiv.style.textAlign = 'center';

	document.getElementsByTagName('body')[0].appendChild(iDiv);
}

const removeTooltip = () => {
	var element = document.getElementById("quotetooltip");
	element.remove();
}