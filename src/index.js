import React from 'react';
import ReactDOM from 'react-dom';
import './index.css'; // Optional, depending on your app setup
import App from './App'; // Correctly import the App component

ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    document.getElementById('root') // Make sure there's a root div in your public/index.html
);
