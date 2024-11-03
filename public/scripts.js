document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('click', () => {
        alert('This service is under construction.');
    });
});

// Language file paths
const languageFiles = {
    en: '/lang-en.json',
    ru: '/lang-ru.json',
    kk: '/lang-kk.json'
};

// Function to load translations
function loadLanguage(language) {
    fetch(languageFiles[language])
        .then(response => response.json())
        .then(data => {
            // Header translations
            const loginLink = document.getElementById('login-link');
            if (loginLink) loginLink.textContent = data.header.login;

            const signupLink = document.getElementById('signup-link');
            if (signupLink) signupLink.textContent = data.header.signup;

            // Logo div
            const logoText = document.getElementById('logo-text');
            if (logoText) logoText.textContent = data.header.public_services;

            // Navigation links
            const votingLink = document.getElementById('voting-link');
            if (votingLink) votingLink.textContent = data.header.voting;

            const personalAccountLink = document.getElementById('personal-account-link');
            if (personalAccountLink) personalAccountLink.textContent = data.header.personal_account;

            const paymentLink = document.getElementById('payment-link');
            if (paymentLink) paymentLink.textContent = data.header.payment;

            const openGovLink = document.getElementById('open-gov-link');
            if (openGovLink) openGovLink.textContent = data.header.open_government;

            const proactiveServicesLink = document.getElementById('proactive-services-link');
            if (proactiveServicesLink) proactiveServicesLink.textContent = data.header.proactive_services;

            const registerStateLink = document.getElementById('register-state-link');
            if (registerStateLink) registerStateLink.textContent = data.header.register_state_services;

            const aboutPortalLink = document.getElementById('about-portal-link');
            if (aboutPortalLink) aboutPortalLink.textContent = data.header.about_portal;

            const helpLink = document.getElementById('help-link');
            if (helpLink) helpLink.textContent = data.header.help;

            // Services section
            const servicesTitle = document.getElementById('services-title');
            if (servicesTitle) servicesTitle.textContent = data.services.for_citizenry;

            const serviceFamily = document.getElementById('service-family');
            if (serviceFamily) serviceFamily.textContent = data.services.family;

            const serviceHealthcare = document.getElementById('service-healthcare');
            if (serviceHealthcare) serviceHealthcare.textContent = data.services.healthcare;

            const serviceEducation = document.getElementById('service-education');
            if (serviceEducation) serviceEducation.textContent = data.services.education;

            // Voting page elements
            const candidate1Button = document.getElementById('candidate1');
            if (candidate1Button) candidate1Button.textContent = data.voting.candidate1;

            const candidate2Button = document.getElementById('candidate2');
            if (candidate2Button) candidate2Button.textContent = data.voting.candidate2;

            const resultsHeader = document.querySelector('.results h3');
            if (resultsHeader) resultsHeader.textContent = data.voting.results;

            // Register and Login pages
            const registerTitle = document.getElementById('register_title');
            if (registerTitle) registerTitle.textContent = data.auth.register_title;

            const registerButton = document.getElementById('register_button');
            if (registerButton) registerButton.textContent = data.auth.register_button;

            const loginTitle = document.querySelector('.auth h3');
            if (loginTitle && loginTitle.textContent === 'Login') {
                loginTitle.textContent = data.auth.login_title;
            }

            const loginButton = document.querySelector('#loginForm button');
            if (loginButton) loginButton.textContent = data.auth.login_button;

            // Personal account page
            const personalAccountTitle = document.getElementById('title');
            if (personalAccountTitle) personalAccountTitle.textContent = data.personal_account.title;

            const yourVote = document.getElementById('yourVote');
            if (yourVote) yourVote.textContent = data.personal_account.your_vote;

            // Footer
            const footerText = document.querySelector('footer p');
            if (footerText) footerText.textContent = data.footer.copyright;
        })
        .catch(error => console.error('Error loading language file:', error));
}

// Event listeners for language switching
document.getElementById('kk').addEventListener('click', function (e) {
    e.preventDefault();
    loadLanguage('kk');
    localStorage.setItem('selectedLanguage', 'kk');
});

document.getElementById('ru').addEventListener('click', function (e) {
    e.preventDefault();
    loadLanguage('ru');
    localStorage.setItem('selectedLanguage', 'ru');
});

document.getElementById('en').addEventListener('click', function (e) {
    e.preventDefault();
    loadLanguage('en');
    localStorage.setItem('selectedLanguage', 'en');
});

// Load language on page load
window.addEventListener('DOMContentLoaded', () => {
    const savedLanguage = localStorage.getItem('selectedLanguage') || 'en'; // Default to English
    loadLanguage(savedLanguage);
});


document.addEventListener('DOMContentLoaded', function () {
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');

    if (registerForm) {
        registerForm.addEventListener('submit', function (event) {
            event.preventDefault();
            const username = document.getElementById('registerUsername').value;
            const password = document.getElementById('registerPassword').value;

            fetch('/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                if (data.message === 'User registered successfully') {
                    window.location.href = 'login.html'; // Redirect to login after registration
                }
            });
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', function (event) {
            event.preventDefault();
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;

            fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    alert(data.message);
                    sessionStorage.setItem('loggedInUser', JSON.stringify(data.user));
                    window.location.href = 'voting.html'; // Redirect to voting page on successful login
                } else {
                    alert(data.error);
                }
            });
        });
    }

    // Voting functionality with confirmation
    const candidate1Button = document.getElementById('candidate1');
    const candidate2Button = document.getElementById('candidate2');

    if (candidate1Button) {
        candidate1Button.addEventListener('click', function () {
            showConfirmation(1);
        });
    }

    if (candidate2Button) {
        candidate2Button.addEventListener('click', function () {
            showConfirmation(2);
        });
    }

    function showConfirmation(candidate) {
        const confirmationDiv = document.getElementById('confirmation');
        confirmationDiv.style.display = 'block';

        document.getElementById('confirmVote').onclick = function() {
            castVote(candidate);
        };

        document.getElementById('cancelVote').onclick = function() {
            confirmationDiv.style.display = 'none';
        };
    }

    function castVote(candidate) {
        const user = JSON.parse(sessionStorage.getItem('loggedInUser'));

        fetch('/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, candidate })
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            loadVoteCounts(); // Refresh vote counts
        });
        document.getElementById('confirmation').style.display = 'none';
    }

    // Load vote counts on voting page
    function loadVoteCounts() {
        fetch('/results')
            .then(response => response.json())
            .then(data => {
                // Reset counts to 0 before updating
                document.getElementById('candidate1Votes').textContent = 0;
                document.getElementById('candidate2Votes').textContent = 0;
    
                // Update counts based on fetched data
                data.forEach(result => {
                    if (result.candidate === '1') {
                        document.getElementById('candidate1Votes').textContent = result.count;
                    } else if (result.candidate === '2') {
                        document.getElementById('candidate2Votes').textContent = result.count;
                    }
                });
            });
    }
    

    // Show user data in personal account
    if (document.getElementById('personal-account')) {
        const user = JSON.parse(sessionStorage.getItem('loggedInUser'));
        if (user) {
            document.getElementById('username').textContent = user.username;
            document.getElementById('publicKey').textContent = user.publicKey;

            // Fetch and display the candidate voted for
            fetch(`/user/vote/${user.id}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    document.getElementById('yourVote').textContent = data.candidate;
                })
                .catch(error => {
                    console.error('There was a problem with the fetch operation:', error);
                    document.getElementById('yourVote').textContent = 'Error retrieving vote information.';
                });
        }
    }
});
