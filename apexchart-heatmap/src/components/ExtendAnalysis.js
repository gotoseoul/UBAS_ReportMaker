import React, { useEffect, useState } from 'react';
import MapComponent from './MapComponent';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

// Utility function to decode base64 to UTF-8
function decodeBase64ToUtf8(base64String) {
  try {
    const binaryString = atob(base64String);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const decodedString = new TextDecoder('utf-8').decode(bytes);
    return decodedString;
  } catch (error) {
    console.error('Error decoding base64 to UTF-8:', error);
    return 'Decoding failed';
  }
}

const ExtendAnalysis = ({ wifiDataRaw = '', recentFileDataRaw = '' }) => {
  const [decodedRecentFileData, setDecodedRecentFileData] = useState([]);

  useEffect(() => {
    if (recentFileDataRaw) {
      const parsedData = recentFileDataRaw.split('\n\n').map((entry) => {
        const lines = entry.split('\n');
        const timestamp = lines.find(line => line.startsWith('Timestamp:'))?.split(': ')[1];
        const fileItemID = lines.find(line => line.startsWith('FileItemID:'))?.split(': ')[1];
        const base64Data = lines.find(line => line.startsWith('Data (Base64 Encoded):'))?.split(': ')[1];
        
        let decodedData = decodeBase64ToUtf8(base64Data);

        return { timestamp, fileItemID, decodedData };
      });

      setDecodedRecentFileData(parsedData);
    } else {
      setDecodedRecentFileData([]);
    }
  }, [recentFileDataRaw]);

  return (
    <Box>
      {/* WiFi 데이터가 있을 경우에만 렌더링 */}
      {wifiDataRaw && (
        <>
          <Typography variant="h5" align="center" mt={4}>
            WiFi Location Analysis
          </Typography>
          <Box mt={2} mb={4}>
            <MapComponent wifiDataRaw={wifiDataRaw} />
          </Box>
        </>
      )}

      {/* recentFileData가 있을 경우에만 렌더링 */}
      {decodedRecentFileData.length > 0 && (
        <>
          <Typography variant="h5" align="center" mt={4}>
            Recent File Analysis
          </Typography>
          <TableContainer component={Paper} style={{ marginTop: '20px' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>No</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>FileItemID</TableCell>
                  <TableCell>Decoded Data</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {decodedRecentFileData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.timestamp}</TableCell>
                    <TableCell>{item.fileItemID}</TableCell>
                    <TableCell style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{item.decodedData}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
};

export default ExtendAnalysis;
