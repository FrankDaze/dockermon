// Express + Dockerode Dashboard Server (mit JSON-Routen für dynamische UI)

const express = require('express');
const Docker = require('dockerode');
const path = require('path');
const session = require('express-session');
const docker = new Docker();
require('dotenv').config();

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.use(express.static(path.join(__dirname, 'public')));

// Session Middleware zurück zu MemoryStore
app.use(session({
    secret: process.env.SESSION_SECRET || 'e7f3c9a1d4b8f6a7c2e9d5f4a3b7c6e8', // Load session secret from environment variable
    resave: false,
    saveUninitialized: true
}));

/**
 * Middleware to check if the user is authenticated.
 * Redirects to the login page if the user is not logged in.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
function checkAuth(req, res, next) {
    if (req.session.loggedIn) {
        next();
    } else {
        res.redirect('/login');
    }
}

/**
 * Route to render the login page.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
app.get('/login', (req, res) => {
    res.render('login');
});

/**
 * Route to handle login form submission.
 * Validates the username and password against environment variables.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
app.post('/login', (req, res) => {
    const {
        user_name,
        user_pass
    } = req.body;
    if (user_name === process.env.USERNAME && user_pass === process.env.PASSWORD) {
        req.session.loggedIn = true;
        res.redirect('/');
    } else {
        res.redirect('/');
    }
});

/**
 * Route to handle user logout.
 * Destroys the session and redirects to the login page.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

/**
 * Route to render the dashboard page.
 * Fetches Docker container data and groups them by project.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
app.get('/', checkAuth, async (req, res) => {
    try {
        const containers = await docker.listContainers({
            all: true
        });

        const groupedContainers = {};

        containers.forEach(container => {
            const group = container.Labels['com.docker.compose.project'] || 'Ungruppiert';
            if (!groupedContainers[group]) {
                groupedContainers[group] = {
                    containers: [],
                    status: 'stopped'
                };
            }
            groupedContainers[group].containers.push(container);
        });

        // Status je Gruppe berechnen
        for (const group in groupedContainers) {
            const all = groupedContainers[group].containers;
            const running = all.filter(c => c.State === 'running').length;
            const total = all.length;
            groupedContainers[group].status =
                running === 0 ? 'stopped' :
                running === total ? 'running' : 'partial';
        }

        res.render('index', {
            groupedContainers
        });
    } catch (err) {
        res.status(500).send('<h1 class="text-red-500">Error fetching containers:</h1><pre>' + err.message + '</pre>');
    }
});

/**
 * API route to start a specific Docker container.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
app.post('/api/start/:id', async (req, res) => {
    try {
        await docker.getContainer(req.params.id).start();
        res.json({
            success: true
        });
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

/**
 * API route to stop a specific Docker container.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
app.post('/api/stop/:id', async (req, res) => {
    try {
        await docker.getContainer(req.params.id).stop();
        res.json({
            success: true
        });
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

/**
 * API route to delete a specific Docker container.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
app.post('/api/delete/:id', async (req, res) => {
    try {
        await docker.getContainer(req.params.id).remove({
            force: true
        });
        res.json({
            success: true
        });
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

/**
 * API route to perform actions on all containers in a group.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
app.post('/api/group-action/:group', async (req, res) => {
    const {
        group
    } = req.params;
    const {
        action
    } = req.body;
    try {
        const containers = await docker.listContainers({
            all: true
        });
        const groupContainers = containers.filter(c => c.Labels['com.docker.compose.project'] === group);

        for (const container of groupContainers) {
            const dockerContainer = docker.getContainer(container.Id);
            if (action === 'start' && container.State !== 'running') await dockerContainer.start();
            if (action === 'stop' && container.State === 'running') await dockerContainer.stop();
        }

        res.json({
            success: true
        });
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
});

app.listen(port, () => {
    console.log(`🚀 Server läuft unter http://localhost:${port}`);
});