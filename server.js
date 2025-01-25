import express from 'express';
import livereload from 'livereload';
import connectLivereload from 'connect-livereload';
import path from 'path';

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
liveReloadServer.watch(process.cwd());

// Add livereload middleware to express BEFORE static middleware
app.use(connectLivereload());

// Add route for settings page
app.get('/settings', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'settings.html'));
});

// Serve static files with correct MIME types
app.use(express.static('./', {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
        }
    }
}));

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Live reload enabled - changes will auto-refresh the browser');
}); 