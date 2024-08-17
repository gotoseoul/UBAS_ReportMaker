import React, { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import axios from 'axios';

const FileUpload = ({ onDataLoaded }) => {
  const [file, setFile] = useState(null);

  const onFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const onFileUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5001/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Notify the parent component that data has been loaded
      onDataLoaded(response.data);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  return (
    <Box>
      <Typography variant="h6">Upload ULD.db</Typography>
      <input type="file" onChange={onFileChange} />
      <Button variant="contained" color="primary" onClick={onFileUpload} disabled={!file}>
        Upload
      </Button>
    </Box>
  );
};

export default FileUpload;
