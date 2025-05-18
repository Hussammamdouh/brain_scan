const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const scanRoutes = require('./routes/scanRoutes');
const profileRoutes = require('./routes/profileRoutes');
const adminRoutes = require('./routes/adminRoutes');
const testRoutes = require('./routes/testRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');

const app = express();
app.set('trust proxy', true);
// Middlewares
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));
app.use(helmet());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to BrainScan API',
        version: '1.0.0',
        documentation: '/api-docs',
        endpoints: {
            auth: '/api/auth',
            profile: '/api/profile',
            scan: '/api/scan',
            admin: '/api/admin',
            test: '/api/test',
            chatbot: '/api/chatbot'
        }
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/test', testRoutes);
app.use('/api/chatbot', chatbotRoutes);

// serve uploads folder
app.use('/uploads', express.static('uploads'));

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "BrainScan API Documentation"
}));

// Error Handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
