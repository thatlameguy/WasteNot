import { useState, useEffect } from 'react';
import { API_URL } from '../utils/api';

const TestConnection = () => {
  const [connectionStatus, setConnectionStatus] = useState('Testing connection...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('Testing connection to:', `${API_URL}/test-connection`);
        const response = await fetch(`${API_URL}/test-connection`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setConnectionStatus(`Connected: ${data.message}`);
          console.log('Connection successful:', data);
        } else {
          const errorText = await response.text();
          setError(`Failed to connect: ${response.status} ${errorText}`);
          console.error('Connection failed:', response.status, errorText);
        }
      } catch (err) {
        setError(`Error: ${err.message}`);
        console.error('Connection error:', err);
      } finally {
        setLoading(false);
      }
    };

    testConnection();
  }, []);

  return (
    <div style={{ padding: '20px', borderRadius: '8px', backgroundColor: '#f5f5f5', marginTop: '20px' }}>
      <h3>Backend Connection Test</h3>
      {loading ? (
        <p>Testing connection to backend...</p>
      ) : error ? (
        <div style={{ color: 'red' }}>
          <p>{error}</p>
          <p>Endpoint: {`${API_URL}/test-connection`}</p>
        </div>
      ) : (
        <div style={{ color: 'green' }}>
          <p>{connectionStatus}</p>
          <p>API URL: {API_URL}</p>
        </div>
      )}
    </div>
  );
};

export default TestConnection; 