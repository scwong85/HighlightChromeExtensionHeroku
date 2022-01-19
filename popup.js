const logout = document.getElementById('logout-btn');

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

logout.addEventListener( 'click', ()=> {
	chrome.storage.local.clear();
});

readLocalStorage('hlData')
  .then(login_data => {
	if (login_data !== 'fail' && login_data !== undefined && login_data !== null) {
		logout.style.display = "block";
	} else {
		logout.style.display = "none";
	}
  })
