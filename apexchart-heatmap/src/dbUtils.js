import axios from 'axios';

export const getData = async (callback) => {
  try {
    const response = await axios.get('http://localhost:5000/api/data');
    const data = response.data;
    console.log('Fetched Data:', data);
    callback(data);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};
