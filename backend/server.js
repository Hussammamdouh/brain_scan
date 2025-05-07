const app = require('./app');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log('MongoDB Connected ✅');
    app.listen(PORT, () => console.log(`Server Running On Port ${PORT}...`));
})
.catch((error) => {
    console.error(error);
    process.exit(1);
});
