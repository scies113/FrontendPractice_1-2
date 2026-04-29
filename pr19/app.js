const express = require('express');
const sequelize = require('./config/db');
const userRoutes = require('./routes/userRoutes');
require('dotenv').config();

const app = express();
app.use(express.json());

app.use('/api', userRoutes);

const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('✅ Connected to DB and Synced');
    app.listen(process.env.PORT || 3000, () => {
      console.log(`🚀 Server ready on port ${process.env.PORT || 3000}`);
    });
  } catch (e) {
    console.error('❌ DB Connection Error:', e);
  }
};

start();
