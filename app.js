// app.js
const express = require('express');
const bodyParser = require('body-parser');
const connection = require('./db'); // MySQL connection
const bcrypt = require('bcrypt');
const { generateKeyPairSync, createSign, createVerify } = require('crypto');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files

// Function to generate EDS keys
function generateEDSKeys() {
    return generateKeyPairSync('rsa', {
        modulusLength: 2048,
    });
}

// Route to register a user
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const { publicKey, privateKey } = generateEDSKeys(); // Generate EDS keys

    const sql = 'INSERT INTO users (username, password, eds_public_key, eds_private_key) VALUES (?, ?, ?, ?)';
    connection.query(sql, [username, hashedPassword, 
        publicKey.export({ type: 'spki', format: 'pem' }), 
        privateKey.export({ type: 'pkcs8', format: 'pem' })], 
        (error, results) => {
            if (error) {
                return res.status(500).json({ error: 'Registration failed' });
            }
            res.status(201).json({ message: 'User registered successfully', userId: results.insertId });
        }
    );
});

// Route to login a user
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    connection.query('SELECT * FROM users WHERE username = ?', [username], async (error, results) => {
        if (error || results.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        const user = results[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (passwordMatch) {
            res.status(200).json({ message: 'Login successful', user: { id: user.id, username: user.username, publicKey: user.eds_public_key } });
        } else {
            res.status(401).json({ error: 'Incorrect password' });
        }
    });
});

// Route to cast a vote
app.post('/vote', (req, res) => {
    const { userId, candidate } = req.body;

    console.log(`Vote request received: userId=${userId}, candidate=${candidate}`); // Log incoming request

    connection.query('SELECT * FROM users WHERE id = ?', [userId], (error, results) => {
        if (error) {
            console.error('Error fetching user:', error); // Log the error
            return res.status(500).json({ error: 'Error fetching user' });
        }

        if (results.length === 0) {
            console.error('User not found:', userId); // Log if no user found
            return res.status(404).json({ error: 'User not found' });
        }

        const user = results[0];
        if (user.has_voted) {
            console.error('User has already voted:', userId); // Log if user has voted
            return res.status(400).json({ error: 'User has already voted' });
        }

        // Convert candidate to a numeric string to ensure consistency in storage
        const candidateNumeric = candidate === 1 ? '1' : '2';

        // Create signature for the vote
        const sign = createSign('SHA256');
        sign.update(candidateNumeric); // Use the numeric candidate string for signing
        sign.end();

        const signature = sign.sign(user.eds_private_key, 'hex');
        console.log(`Signature generated: ${signature}`);

        // Insert vote into the database with consistent numeric candidate value
        connection.query('INSERT INTO votes (user_id, candidate, eds) VALUES (?, ?, ?)', 
            [userId, candidateNumeric, signature], (error, results) => {
            if (error) {
                console.error('Error inserting vote:', error);
                return res.status(500).json({ error: 'Vote submission failed' });
            }

            // Mark the user as having voted
            connection.query('UPDATE users SET has_voted = TRUE WHERE id = ?', [userId], (error) => {
                if (error) {
                    console.error('Error updating user vote status:', error);
                    return res.status(500).json({ error: 'Failed to update user vote status' });
                }
                res.status(200).json({ message: 'Vote submitted successfully' });
            });
        });
    });
});





// Route to get vote counts
app.get('/results', (req, res) => {
    connection.query('SELECT candidate, COUNT(*) as count FROM votes GROUP BY candidate', (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Failed to retrieve results' });
        }
        console.log('Vote counts retrieved:', results);
        res.json(results);
    });
});


// Route to get user voting information
app.get('/user/vote/:id', (req, res) => {
    const userId = req.params.id;

    connection.query('SELECT candidate FROM votes WHERE user_id = ?', [userId], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Failed to retrieve voting information' });
        }
        if (results.length > 0) {
            res.json({ candidate: results[0].candidate });
        } else {
            res.json({ candidate: 'Not voted yet' });
        }
    });
});


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
