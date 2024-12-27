import React from 'react';
import './app.css';
import SalaryForm from './SalaryForm';
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter

function App() {
    return (
        <BrowserRouter> {/* Wrap your App component with BrowserRouter */}
            <div className="App">
                <header className="App-header">
                    <SalaryForm />
                </header>
            </div>
        </BrowserRouter>
    );
}

export default App; // Export App as a functional component
