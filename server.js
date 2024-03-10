// server.js

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb+srv://cheikhnoris69:moimoimm1@cluster0.z3njxac.mongodb.net/myapp', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// User Model
const User = mongoose.model('User', { email: String, password: String, progress: { type: Number, default: 1 } });

// Question Model
const Question = mongoose.model('Question', { id: Number, question: String, answer: String });

// Token Model
const Token = mongoose.model('Token', { userId: String, token: String, expiresAt: Date });

// Generate JWT token
const generateToken = (userId) => {
  const token = jwt.sign({ userId }, 'your_secret', { expiresIn: '1d' }); // Token expires in 1 day
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day in milliseconds
  return { token, expiresAt };
};

// Register route
app.post('/register', async (req, res) => {
    try {
      console.log('Data received for registration:', req.body); // Log des données reçues pour l'inscription
      const { email, password } = req.body;
      
      // Création d'un nouvel utilisateur
      const newUser = await User.create({ email, password });
      console.log('New user registered:', newUser); // Log du nouvel utilisateur enregistré
  
      // Génération du token
      const tokenData = generateToken(newUser._id);
      console.log('Generated token data:', tokenData); // Log des données du token généré
  
      // Ajout du token à la collection
      await Token.create({ userId: newUser._id, ...tokenData });
      console.log('Token added to collection:', tokenData); // Log du token ajouté à la collection
  
      res.status(200).json(tokenData);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error registering user' });
    }
  });
  // Middleware pour vérifier le token
const verifyToken = async (req, res, next) => {
    const token = req.headers.authorization;
  
    if (!token) {
      return res.status(403).json({ message: 'Token is required' });
    }
  
    try {
      const decoded = jwt.verify(token, 'your_secret');
      req.userId = decoded.userId; // Stockez l'ID de l'utilisateur dans la requête pour une utilisation ultérieure
      next();
    } catch (error) {
      console.error('Error verifying token:', error);
      return res.status(401).json({ message: 'Invalid token' });
    }
  };
  

  // Ajoutez le middleware de vérification de token à la route /questions
// Ajouter le champ de progression lors de l'inscription
app.post('/register', async (req, res) => {
    try {
      console.log('Data received for registration:', req.body);
      const { email, password } = req.body;
      const newUser = await User.create({ email, password });
      console.log('New user registered:', newUser);
      const tokenData = generateToken(newUser._id);
      console.log('Generated token data:', tokenData);
      await Token.create({ userId: newUser._id, ...tokenData });
      console.log('Token added to collection:', tokenData);
      res.status(200).json(tokenData);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error registering user' });
    }
  });
  
  // Récupérer les questions basées sur le progrès de l'utilisateur
// Ajoutez le middleware de vérification de token à la route /questions
app.get('/questions', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const questionIndex = user.progress - 1; // L'indice de la question basé sur le progrès
    const question = await Question.findOne({ id: questionIndex + 1 }); // Récupérer la question correspondante
    res.status(200).json([question]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching questions' });
  }
});

  

  // Ajoutez une route pour soumettre les réponses des utilisateurs
  app.post('/submit-answer', verifyToken, async (req, res) => {
    try {
      const { questionId, userAnswer } = req.body;
      const question = await Question.findById(questionId);
      
      if (!question) {
        return res.status(404).json({ message: 'Question not found' });
      }
  
      if (question.answer === userAnswer) {
        const user = await User.findById(req.userId);
        user.progress += 1; // Augmenter le progrès de l'utilisateur
        await user.save();
        
        // Récupérer la prochaine question basée sur le progrès mis à jour de l'utilisateur
        const nextQuestionIndex = user.progress - 1;
        const nextQuestion = await Question.findOne({ id: nextQuestionIndex + 1 });
        
        return res.status(200).json({ message: 'Correct answer!', nextQuestion });
      } else {
        return res.status(200).json({ message: 'Incorrect answer!' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error submitting answer' });
    }
});

  
  
// Login route
// Login route
app.post('/login', async (req, res) => {
    try {
      console.log('Received login request:', req.body);
      const { email, password } = req.body;
      console.log('Searching for user with email:', email);
      const user = await User.findOne({ email });
      if (!user) {
        console.log('User not found');
        return res.status(404).json({ message: 'User not found' });
      }
      const isPasswordValid = password === user.password;
      if (!isPasswordValid) {
        console.log('Invalid password');
        return res.status(401).json({ message: 'Invalid password' });
      }
      
      // Verification of the expired token
      const tokenDoc = await Token.findOne({ userId: user._id });
      const tokenExpired = tokenDoc && new Date(tokenDoc.expiresAt) < new Date();

      if (tokenExpired) {
        // Generating a new token
        const newTokenData = generateToken(user._id);
        const newExpiresAt = new Date();
        newExpiresAt.setDate(newExpiresAt.getDate() + 1); // Set expiration date to today + 1 day
        await Token.findOneAndUpdate(
          { userId: user._id },
          { token: newTokenData.token, expiresAt: newExpiresAt }
        );
        console.log('New token generated:', newTokenData);
        return res.status(200).json(newTokenData);
      } else if (tokenDoc) {
        console.log('Token still valid');
        return res.status(200).json({ token: tokenDoc.token, expiresAt: tokenDoc.expiresAt });
      } else {
        // Generating a new token if no token exists
        const tokenData = generateToken(user._id);
        await Token.create({ userId: user._id, ...tokenData });
        console.log('Token generated:', tokenData);
        return res.status(200).json(tokenData);
      }
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ message: 'Error logging in' });
    }
  });



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
