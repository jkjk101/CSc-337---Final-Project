function login() {
    const data = { username: document.getElementById('username').value, password: document.getElementById('password').value };
    fetch('/account/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (response.status === 200) {
            window.location.pathname = '/home.html';
        } else if (response.status === 401) {
            alert('Invalid username or password.');
            document.getElementById('password').select();
        } else if (response.status === 404) {
            alert('Username not found.');
            document.getElementById('username').select();
        }
    })
    .catch(error => console.error(error));
}

function logout() {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
    }
    window.location.pathname = '/index.html';
}

function checkAvailability() {
    const username = document.getElementById('username').value;
    fetch('/account/availability/' + username).then((response) => {
        if (response.status === 200) {
            document.getElementById('availability').innerHTML = 'This username is available.';
            document.getElementById('create-acc-btn').disabled = false;
		
        } else if (response.status === 403) {
            document.getElementById('availability').innerHTML = 'This username is not available.';
            document.getElementById('create-acc-btn').disabled = true;
        }
    });
}

function picturePreview(event) {
    const previewImg = document.getElementById("preview");
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => previewImg.src = reader.result;
}

function createAccount(event) {
    event.preventDefault(); // prevent form from submitting
    const form = document.getElementById('create-acc-form');
    const formData = new FormData(form);
    fetch('/create/userprofile', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (response.status === 201) {
            alert('Account created successfully!');
            window.location.pathname = '/home.html';
        } else if (response.status === 400) {
            alert('Account creation failed.');
        }
    })
}

function createProject(event) {
    document.getElementById('create-proj-btn').disabled = true;
    event.preventDefault(); // prevent form from submitting
    const form = document.getElementById('create-proj-form');
    const formData = new FormData(form);
    fetch('/create/project', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (response.status === 201) {
            alert('Project created successfully!');
            window.location.pathname = '/home.html';
        } else if (response.status === 413) {
            alert('File size too large (greater than 2 GiB).');
        }
        document.getElementById('create-proj-btn').disabled = false;
    })
}

function search() {
    const profile = document.getElementById('profile');
    const project = document.getElementById('project');
    const keyword = document.getElementById('keyword').value;
    let url = '';

    if (profile.checked) {
        url = '/search/profile/' + keyword;
    } else if (project.checked) {
        url = '/search/project/' + keyword;
    }

    fetch(url).then(response => response.text())
    .then(data => {
        console.log(data);
    });
}

function checkExpired() {
    fetch('/session/isloggedin').then(response => {
        if (response.status === 200) {
            // continue
        } else if (response.status === 401) {
            window.location.pathname = '/index.html';
            setTimeout(() => alert('Session expired.'), 500);
        }
    });
}


if (window.location.pathname == '/home.html') {  
    checkExpired();
    setInterval(checkExpired, 1000);
    document.getElementById('search-btn').onclick = search;
    document.getElementById('logout-btn').onclick = logout;
    document.getElementById('new-proj-btn').onclick = () => window.location.pathname = '/post.html';

} else if (window.location.pathname == '/index.html' || window.location.pathname == '/') {
    document.getElementById('login-btn').onclick = login;

} else if (window.location.pathname == '/register.html') {
    document.getElementById('create-acc-form').onsubmit = createAccount;
    document.getElementById('username').oninput = checkAvailability;
    document.getElementById("picture").onchange = picturePreview;

} else if (window.location.pathname == '/post.html') {
    document.getElementById('create-proj-form').onsubmit = createProject;
}