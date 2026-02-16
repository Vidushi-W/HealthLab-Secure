const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler, notFound } = require('./middlewares/errorMiddleware');

// Routes
const authRoutes = require('./routes/authRoutes');
const fundRequestRoutes = require('./routes/fundRequestRoutes');
const adminRoutes = require('./routes/adminRoutes');
const experimentRoutes = require('./routes/experimentRoutes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => {
    res.send('HealthLab Fund Management API is running. Docs at /docs');
});

// Swagger
require('./config/swagger')(app);

// Route mounting
app.use('/api/auth', authRoutes);
app.use('/api/fund-requests', fundRequestRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/experiments', experimentRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
