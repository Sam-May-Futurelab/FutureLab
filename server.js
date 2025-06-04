const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files
app.use(express.static(__dirname));

// Handle clean URLs - redirect to .html files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/web-design', (req, res) => {
    res.sendFile(path.join(__dirname, 'web-design.html'));
});

app.get('/portfolio', (req, res) => {
    res.sendFile(path.join(__dirname, 'portfolio.html'));
});

app.get('/custom-web-design', (req, res) => {
    res.sendFile(path.join(__dirname, 'custom-web-design.html'));
});

app.get('/lab', (req, res) => {
    res.sendFile(path.join(__dirname, 'lab.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'contact.html'));
});

app.get('/blog', (req, res) => {
    res.sendFile(path.join(__dirname, 'blog.html'));
});

app.get('/faq', (req, res) => {
    res.sendFile(path.join(__dirname, 'faq.html'));
});

app.get('/showcase', (req, res) => {
    res.sendFile(path.join(__dirname, 'showcase.html'));
});

app.get('/hosting-guide', (req, res) => {
    res.sendFile(path.join(__dirname, 'hosting-guide.html'));
});

app.get('/privacy-policy', (req, res) => {
    res.sendFile(path.join(__dirname, 'privacy-policy.html'));
});

app.get('/ecommerce', (req, res) => {
    res.sendFile(path.join(__dirname, 'ecommerce.html'));
});

// Handle blog posts
app.get('/blog/:slug', (req, res) => {
    const slug = req.params.slug;
    res.sendFile(path.join(__dirname, 'blog', `${slug}.html`));
});

// Fallback for any other routes
app.get('*', (req, res) => {
    res.status(404).send('Page not found');
});

app.listen(port, () => {
    console.log(`Local server running at http://localhost:${port}`);
    console.log('Your clean URLs will work here!');
});
