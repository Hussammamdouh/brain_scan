const app = require('./app');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log('MongoDB Connected ✅');
    // Start the server after successful database connection
    app.listen(PORT, () => console.log(`Server Running On Port ${PORT}...`));
})
.catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
});

// Export the Express app for Vercel
module.exports = app;
