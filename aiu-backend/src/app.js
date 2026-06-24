const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRouter = require('./routes/auth');
const historyRouter = require('./routes/history');

const app = express();

// Security and middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes mounting
app.use('/api/auth', authRouter);
app.use('/api', historyRouter);

module.exports = app;
