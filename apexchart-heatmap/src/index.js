import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import ApexChart from './App';
import reportWebVitals from './reportWebVitals';

ReactDOM.render(
  <React.StrictMode>
    <ApexChart />
  </React.StrictMode>,
  document.getElementById('root') // Ensure this targets the correct element ID
);

reportWebVitals();
