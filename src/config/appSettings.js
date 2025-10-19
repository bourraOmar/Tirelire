const express = require('express'); 
const cors = require('cors');       
const morgan = require('morgan');   


const configureApp = () => {
    const app = express(); 

    app.use(cors({
        origin: 'http://localhost:5000',
        credentials: true
    }));

    app.use(morgan('combined')); 

    app.use(express.json({ limit: '10mb' }));           
    app.use(express.urlencoded({ extended: true, limit: '10mb' })); 

    return app;
};

module.exports = configureApp;