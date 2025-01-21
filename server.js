const express = require('express');
const livereload = require('livereload');
const connectLivereload = require('connect-livereload');

const app = express();
const port = 8000;

// Configure livereload server
const liveReloadServer = livereload.createServer({
    // Add some delay for the page to reload
    delay: 100,
    // Explicitly enable JS injection
    port: 35729
});

// Watch all files in the current directory
liveReloadServer.watch(__dirname);

// Add livereload middleware to express BEFORE static middleware
app.use(connectLivereload());

// Serve static files
app.use(express.static('./'));

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Live reload enabled - changes will auto-refresh the browser');
}); 