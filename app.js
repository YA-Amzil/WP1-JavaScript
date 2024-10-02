const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const dataRouter = require('./routes/data'); 

const app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Use the data router for /data route
app.use('/data', dataRouter);

// Error handling for invalid JSON
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).send({ message: 'Invalid JSON payload passed.' });
    }
});

// Catch 404 and forward to error handler
app.use((req, res, next) => {
    res.status(404).send({ message: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500).send('Error occurred');
});

module.exports = app;
