const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const logger = require('morgan')
require('dotenv').config()

//import routes
const searchRoute = require('./routes/search')

//middleware
app.use(cors());
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(logger('dev'))
app.use((req, res, next) =>{
  res.header('Access-Control-Allow-Origin', 'http://localhost:8000')
  res.header('Access-Control-Allow-Headers', '*')
  if(req.method === 'OPTIONS'){
    res.header('Access-Control-Allow-Methods', 'PUT, POST, PATH, DELETE, GET')
    return res.status(200).json({})
  }
  next();
})

//routes
app.use('/api/v1/', searchRoute)

//error handling
app.use((req, res, next) =>{
    const error = new Error("Error 404: Route Not found")
    error.status = 404
    next(error)
})
app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
      error: {
        message: error.message
      }
    });
})

//starts server
app.listen(process.env.PORT, () => {
    console.log('Server is running!')
})