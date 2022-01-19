const button = document.querySelector('button');

document.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();

    const username = document.querySelector('#username').value;
    const password = document.querySelector('#password').value;

    
    
    if (username && password) {
      // send message to background script with username and password
        chrome.runtime.sendMessage({
            type: 'login', 
            payload: { username, password }
        },
        function (response) {
            if (response === 'success') {
                console.log('sign in success');
            } else if (response === 'login fail') {
                let loginMsg = document.getElementById('login-error-container');
                loginMsg.style.display = "block";
            }
        });       
    } else {
        document.querySelector('#username').placeholder = "Enter a username.";
        document.querySelector('#password').placeholder = "Enter a password.";
        document.querySelector('#username').style.backgroundColor = 'red';
        document.querySelector('#password').style.backgroundColor = 'red';
        document.querySelector('#username').classList.add('white_placeholder');
        document.querySelector('#password').classList.add('white_placeholder');
    }
});