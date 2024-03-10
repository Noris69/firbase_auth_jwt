// server.js

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb+srv://cheikhnoris69:moimoimm1@cluster0.z3njxac.mongodb.net/myapp', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Token Model
const Token = mongoose.model('Token', { token: String });

// Routes
app.post('/store-token', async (req, res) => {
  try {
    const { token } = req.body;
    await Token.create({ token });
    res.status(200).json({ message: 'Token stored successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error storing token' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
