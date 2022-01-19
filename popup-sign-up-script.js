const button = document.querySelector('button');

document.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();

    const username = document.querySelector('#username').value;
    const password = document.querySelector('#password').value;
    const password2 = document.querySelector('#password2').value;
    const email = document.querySelector('#email').value;

    if (username && password && password2 && email) {
      // send message to background script with username and password
        chrome.runtime.sendMessage({
            type: 'signup', 
            payload: { username, password, password2, email }
        },
        function (response) {
            let errorMsg = '';
            Object.keys(response).map((key) => {
                errorMsg += key + ":" + response[key] + "<br />"
            });
            let signupMsg = document.getElementById('login-error-container');
            signupMsg.style.display = "block";
            signupMsg.innerHTML = errorMsg;
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