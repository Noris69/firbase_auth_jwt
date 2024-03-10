import React, { useState, useEffect, useCallback } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import axios from 'axios';
import './App.css';
import Navbar from './Navbar'; // Import the Navbar component

// Initialize Firebase
const firebaseConfig = {
  // Votre configuration Firebase
  apiKey: "AIzaSyAJoQnbdQifdNMsq5fXWx9d9JE6KxcwLwg",
  authDomain: "ynovapi-43204.firebaseapp.com",
  projectId: "ynovapi-43204",
  storageBucket: "ynovapi-43204.appspot.com",
  messagingSenderId: "675485531833",
  appId: "1:675485531833:web:0a5103f94d3e75eb11a568",
};

firebase.initializeApp(firebaseConfig);

const App = () => {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    const unregisterAuthObserver = firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        loginUser(email, password);
      }
      setUser(user);
    });

    return () => unregisterAuthObserver();
  }, [email, password, currentQuestion]);

  const loginUser = async (email, password) => {
    try {
      const tokenResponse = await axios.post('http://localhost:5000/login', { email, password });
      const token = tokenResponse.data.token;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = token;
    } catch (error) {
      console.error('Error logging in and generating token:', error);
    }
  };

  const fetchQuestion = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/questions', {
        headers: {
          Authorization: token
        }
      });
      const questions = response.data;
      const progress = user ? user.progress : 0;
  
      if (progress >= questions.length) {
        console.log("Congratulations! You have completed the quiz.");
      } else {
        const currentQuestion = questions[progress];
        setCurrentQuestion(currentQuestion);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = token;
      fetchQuestion();
    }
  }, [fetchQuestion]);

  const handleAnswerSubmit = async (answer) => {
    setUserAnswers([...userAnswers, answer]);
  
    try {
      const response = await axios.post('http://localhost:5000/submit-answer', {
        questionId: currentQuestion._id,
        userAnswer: answer
      });
  
      console.log(response.data.message);
  
      if (response.data.message === 'Correct answer!') {
        const updatedUser = { ...user, progress: user.progress + 1 };
        setUser(updatedUser);
  
        if (response.data.nextQuestion) {
          setCurrentQuestion(response.data.nextQuestion);
        }
      } else {
        setNotification('Wrong answer');
        setTimeout(() => {
          setNotification('');
        }, 3000);
      }

      // Réinitialiser l'entrée à une chaîne vide après la soumission
      setUserAnswers('');
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };
  
  const handleLogin = async () => {
    try {
      await firebase.auth().signInWithEmailAndPassword(email, password);
    } catch (error) {
      console.error(error);
      setNotification('Incorrect email or password');
      setTimeout(() => {
      setNotification('');
    }, 3000);
    }
  };

  const handleLogout = async () => {
    try {
      await firebase.auth().signOut();
      localStorage.removeItem('token');
    } catch (error) {
      console.error(error);
    }
  };

  const handleRegister = async () => {
    try {
      await firebase.auth().createUserWithEmailAndPassword(email, password);
      const tokenResponse = await axios.post('http://localhost:5000/register', { email, password });
      const token = tokenResponse.data.token;
      localStorage.setItem('token', token);
    } catch (error) {
      console.error(error);
    }
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  return (
    <div>
      <Navbar user={user} handleLogout={handleLogout} />

       <div className="container">
      
      {user ? (
        <div>
          {currentQuestion ? (
            <div>
              <h2>Question {currentQuestion.id}</h2>
              <p>{currentQuestion.question}</p>
              <input
                className="answer-input"
                type="text"
                value={userAnswers}
                onChange={(e) => setUserAnswers(e.target.value)}
                placeholder="Your answer"
              />
              <button className="submit-btn" onClick={() => handleAnswerSubmit(userAnswers)}>Submit Answer</button>
            </div>
          ) : (
            <p>Congratulations! You have completed the quiz.</p>
          )}
        </div>
      ) : (
        <div>
          <p style={{marginLeft:"30%"}}>Please Connect to Play the Quizz</p>
          <div className="login-form">
            <h2>Login</h2>
            <input type="email" value={email} onChange={handleEmailChange} placeholder="Email" className="email-input" />
            <input type="password" value={password} onChange={handlePasswordChange} placeholder="Password" className="password-input" />
            <div className="button-group">
              <button onClick={handleLogin} className="login-button">Login</button>
              <button onClick={handleRegister} className="register-button">Register</button>
            </div>
          </div>
        </div>
      )}
      {notification && <div className="notification">{notification}</div>}
    </div>
    </div>
   
  );
};

export default App;
