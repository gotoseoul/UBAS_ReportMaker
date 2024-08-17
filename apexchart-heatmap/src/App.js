import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Box, CircularProgress,
    Button, Select, MenuItem, FormControl, InputLabel,
    createTheme, ThemeProvider, CssBaseline
} from '@mui/material';
import axios from 'axios';
import moment from 'moment';
import styled from 'styled-components';
import ExtendAnalysis from './components/ExtendAnalysis';
import TimelineComponent from './components/TimelineComponent';
import ReactApexChart from 'react-apexcharts';
import './index.css';
import './App.css';

/* 히트맵 색상 범례 표 */
const LegendContainer = styled(Box)`
  display: flex;
  flex-wrap: wrap; 
  justify-content: center; 
  margin-bottom: 10px;
  margin-top: 30px;

`;

const LegendItem = styled(Box)`
  display: flex;
  align-items: center;
  margin-right: 5px; 
  margin-bottom: 5px; 
  `;

const ColorBox = styled(Box)`
  width: 12px;
  height: 12px;
  background-color: ${({ color }) => color};
  margin-right: 8px;
`;

const Legend = ({ eventTypeColors }) => {
  return (
    <LegendContainer>
      {Object.entries(eventTypeColors).map(([type, color]) => (
        <LegendItem key={type}>
          <ColorBox color={color} />
          <Typography variant="caption" style={{ fontSize: '10px'}}>{type}</Typography>
        </LegendItem>
      ))}
    </LegendContainer>
  );
};





const theme = createTheme({
    typography: {
        fontFamily: 'Arial',
        h5: {
            fontFamily: 'Lato, serif',
        }
    }
});

const StyledContainer = styled(Container)`
  margin-top: 20px;
`;

const HeatmapContainer = styled(Box)`
  margin-top: 40px;
`;

const StyledFormControl = styled(FormControl)`
  width: 200px;
  margin: 0 auto;
`;

const TableWrapper = styled(Box)`
  margin-top: 20px;
  padding: 20px;
`;

const DATA_TYPE_MAPPING = {
    'Power': 'System-Power',
    'SleepMode': 'System-SleepMode',
    'ScreenLock': 'System-ScreenLock',
    'SystemConfig': 'System-SystemConfig',
    'USB': 'Peripheral-USB',
    'Camera': 'Peripheral-Camera',
    'Wifi': 'Network-Wifi',
    'Bluetooth': 'Network-Bluetooth',
    '[-]': 'Application-[-]',
    'from AppStore': 'Application-from AppStore',
    'from Internet': 'Application-from Internet',

    'Document': 'File-Document',
    'Photo': 'Screenshot-Photo',
    'Video': 'Screenshot-Video'
};

const EVENT_TYPE_COLORS = {
    'Power': '#264653',
    'SleepMode': '#2A9D8F',
    'ScreenLock': '#E9C46A',
    'SystemConfig': '#F4A261',
    'USB': '#E63946',
    'Camera': '#E63946',
    'Wifi': '#A8DADC',
    'Bluetooth': '#457B9D',
    '-': '#BC5090',
    'from AppStore': '#BB5090',
    'from Internet': '#BC5090',
    'Document': '#FF6B6B',
    'Photo': '#FFB6C1',
    'Video': '#6A5ACD'
};

const App = () => {
    const [files, setFiles] = useState({
        dbFile: null,
        locationWifiFile: null,
        recentFile: null,
    });
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [series, setSeries] = useState([
        { name: 'System-Power', data: Array(24).fill(0), color: EVENT_TYPE_COLORS['Power'] },
        { name: 'System-SleepMode', data: Array(24).fill(0), color: EVENT_TYPE_COLORS['SleepMode'] },
        { name: 'System-ScreenLock', data: Array(24).fill(0), color: EVENT_TYPE_COLORS['ScreenLock'] },
        { name: 'System-SystemConfig', data: Array(24).fill(0), color: EVENT_TYPE_COLORS['SystemConfig'] },
        { name: 'Peripheral-USB', data: Array(24).fill(0), color: EVENT_TYPE_COLORS['USB'] },
        { name: 'Peripheral-Camera', data: Array(24).fill(0), color: EVENT_TYPE_COLORS['Camera'] },
        { name: 'Network-Wifi', data: Array(24).fill(0), color: EVENT_TYPE_COLORS['Wifi'] },
        { name: 'Network-Bluetooth', data: Array(24).fill(0), color: EVENT_TYPE_COLORS['Bluetooth'] },
        { name: 'Application-[-]', data: Array(24).fill(0), color: EVENT_TYPE_COLORS['[-]'] },
        { name: 'Application-from AppStore', data: Array(24).fill(0), color: EVENT_TYPE_COLORS['from AppStore'] },
        { name: 'Application-from Internet', data: Array(24).fill(0), color: EVENT_TYPE_COLORS['from Internet'] },
        { name: 'File-Document', data: Array(24).fill(0), color: EVENT_TYPE_COLORS['Document'] },
        { name: 'Screenshot-Photo', data: Array(24).fill(0), color: EVENT_TYPE_COLORS['Photo'] },
        { name: 'Screenshot-Video', data: Array(24).fill(0), color: EVENT_TYPE_COLORS['Video'] },
      
    ]);
    const [tooltipData, setTooltipData] = useState({
        'System-Power': {}, 'System-SleepMode': {}, 'System-ScreenLock': {},
        'System-SystemConfig': {}, 'Peripheral-USB': {}, 'Network-Wifi': {},
        'Network-Bluetooth': {}, 'Application-[-]': {}, 'Application-from AppStore': {},
        'Application-from Internet': {}, 'File-Document': {}, 'Screenshot-Photo': {}, 'Screenshot-Video': {}
    });
    const [availableDates, setAvailableDates] = useState([]);
    const [heatmapSelectedDate, setHeatmapSelectedDate] = useState('');
    const [timelineSelectedDate, setTimelineSelectedDate] = useState('');
    const [selectedDetails, setSelectedDetails] = useState([]);

    const [wifiData, setWifiData] = useState('');
    const [recentFileData, setRecentFileData] = useState('');

    const onFileChange = (e) => {
        const { name, files } = e.target;

        setFiles(prevFiles => ({
            ...prevFiles,
            [name]: files[0]
        }));
    };

    const onFileUpload = async (e) => {
        e.preventDefault(); // Prevent the default form submission behavior

        if (!files.dbFile) {
            alert('Please upload the ULD.db file.');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('ULD', files.dbFile); // 'ULD.db' 파일
        if (files.locationWifiFile) {
            formData.append('locationwifi', files.locationWifiFile); // 'locationwifi.txt' 파일
        }
        if (files.recentFile) {
            formData.append('recentfile', files.recentFile); // 'recentfile.txt' 파일
        }

        try {
            const response = await axios.post('http://localhost:5001/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('Uploaded Data:', response.data);
            // 데이터 저장 후 분석을 위해 Show Report 버튼 클릭을 기다림

        } catch (error) {
            console.error('Error uploading files:', error);
            alert('Failed to upload files. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const loadExistingData = async () => {
        setLoading(true);

        try {
            const response = await axios.get('http://localhost:5001/api/data');
            console.log('Loaded Data:', response.data);

            if (response.data) {
                setData(response.data); // Corrected here, as the response might already be the data
                setShowReport(true);

                // 파일 경로를 통해 데이터 읽기
                if (files.locationWifiFile) {
                    const wifiResponse = await axios.get(`/locationwifi.txt`);
                    setWifiData(wifiResponse.data);
                }
                if (files.recentFile) {
                    const recentFileResponse = await axios.get(`/recentfile.txt`);
                    setRecentFileData(recentFileResponse.data);
                }
            }

        } catch (error) {
            console.error('Error loading data:', error);
            alert('Failed to load data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (data) {
            const dates = Array.from(new Set(data.map(row => moment(row.Timestamp, 'YYYY-MM-DD HH:mm:ss.SSS').format('YYYY-MM-DD'))));
            dates.sort((a, b) => moment(a).diff(moment(b)));
            setAvailableDates(dates);
            if (dates.length > 0) {
                setHeatmapSelectedDate(dates[0]);
                setTimelineSelectedDate(dates[0]);
            }
        }
    }, [data]);

    useEffect(() => {
        if (data && heatmapSelectedDate) {
            console.log('Filtering Data for Heatmap:', heatmapSelectedDate);

            const filteredData = data.filter(row => moment(row.Timestamp, 'YYYY-MM-DD HH:mm:ss.SSS').format('YYYY-MM-DD') === heatmapSelectedDate);

            const dataMapping = {
                'System-Power': Array(24).fill(0),
                'System-SleepMode': Array(24).fill(0),
                'System-ScreenLock': Array(24).fill(0),
                'System-SystemConfig': Array(24).fill(0),
                'Peripheral-USB': Array(24).fill(0),
                'Peripheral-Camera': Array(24).fill(0),

                'Network-Wifi': Array(24).fill(0),
                'Network-Bluetooth': Array(24).fill(0),
                'Application-[-]': Array(24).fill(0),
                'Application-from AppStore': Array(24).fill(0),
                'Application-from Internet': Array(24).fill(0),
                'File-Document': Array(24).fill(0),
                'Screenshot-Photo': Array(24).fill(0),
                'Screenshot-Video': Array(24).fill(0)
            };

            const tooltipDataTemp = { ...tooltipData };

            filteredData.forEach(row => {
                const hour = moment(row.Timestamp, 'YYYY-MM-DD HH:mm:ss.SSS').utcOffset('+09:00').hour();
                const type = row.Data_Type;

                const typeKey = DATA_TYPE_MAPPING[type];

                if (typeKey) {
                    dataMapping[typeKey][hour]++;
                    if (!tooltipDataTemp[typeKey]) {
                        tooltipDataTemp[typeKey] = {};
                    }
                    if (!tooltipDataTemp[typeKey][hour]) {
                        tooltipDataTemp[typeKey][hour] = [];
                    }
                    tooltipDataTemp[typeKey][hour].push({
                        behavior: row.Data_Type_User_behavior,
                        timestamp: row.Timestamp,
                        subsystem: row.Subsystem,
                        process: row.Process,
                        originalEventMessage: row.Original_eventMessage,
                    });
                }
            });

            console.log('Data Mapping for Heatmap:', dataMapping);

            setTooltipData(tooltipDataTemp);
            setSeries(prevSeries =>
                prevSeries.map(serie => ({
                    ...serie,
                    data: dataMapping[serie.name]
                }))
            );
        }
    }, [data, heatmapSelectedDate]);




    const options = {
       
        chart: {
            height: 550,
            type: 'heatmap',
            events: {
                dataPointSelection: function (event, chartContext, config) {
                    const hour = parseInt(config.w.globals.labels[config.dataPointIndex].split(':')[0]);
                    const seriesName = config.w.globals.seriesNames[config.seriesIndex];
                    const details = tooltipData[seriesName] && tooltipData[seriesName][hour] ? tooltipData[seriesName][hour] : [];
                    const uniqueDetails = Array.from(new Set(details.map(JSON.stringify))).map(JSON.parse);
                    setSelectedDetails(uniqueDetails.sort((a, b) => moment(a.timestamp).diff(moment(b.timestamp))));
                }
            }
        },
        dataLabels: {
            enabled: true,
            formatter: function (val) {
                return val.toString();
            }
        },
        colors: Object.values(EVENT_TYPE_COLORS),
        
        xaxis: {
            type: 'category',
            categories: [
                '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00',
                '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00',
                '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
            ],
        },
        yaxis: {
            labels: {
                show: true,
                style: {
                    colors: [],
                    fontSize: '12px',
                    fontWeight: 400,
                },
            },
        },
        grid: {
            padding: {
                right: 10,
            },
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box height="100px" />
            <Typography variant="h6" align="center" fontSize={30}>Analysis Report Maker</Typography>
            <Box height="50px" />

            <StyledContainer>
                <Box mb={4} textAlign="center">
                    <Typography variant="h4" align="center" gutterBottom>
                        Upload Files
                    </Typography>
                    <Box mb={3}>
                        <Typography variant="h6">ULD.db:</Typography>
                        <input
                            type="file"
                            name="dbFile"
                            accept=".db"
                            onChange={onFileChange}
                        />
                    </Box>

                    <Box mb={3}>
                        <Typography variant="h6">locationwifi.txt:</Typography>
                        <input
                            type="file"
                            name="locationWifiFile"
                            accept=".txt"
                            onChange={onFileChange}
                        />
                    </Box>

                    <Box mb={3}>
                        <Typography variant="h6">recentfile.txt:</Typography>
                        <input
                            type="file"
                            name="recentFile"
                            accept=".txt"
                            onChange={onFileChange}
                        />
                    </Box>

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={onFileUpload} // 버튼 클릭 시 onFileUpload 호출
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Upload Files'}
                    </Button>
                </Box>

                <Box textAlign="center" mt={4}>
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={loadExistingData}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Show Report'}
                    </Button>
                </Box>

                {/* showReport가 true일 때만 ExtendAnalysis 컴포넌트 렌더링 */}
                {showReport && data && (
                    <>
                        {files.locationWifiFile && wifiData && <ExtendAnalysis wifiDataRaw={wifiData} />}
                        {files.recentFile && recentFileData && <ExtendAnalysis recentFileDataRaw={recentFileData} />}

                        <Typography variant="h5" align="center" mt={4}>User Behavior Heatmap</Typography>
                        
                        
                        
                        
                          {/* 범례 컴포넌트 추가 */}
                    <Legend eventTypeColors={EVENT_TYPE_COLORS} />
          
                     
                        <StyledFormControl variant="outlined" margin="normal">
                            <InputLabel>Select Date</InputLabel>
                            <Select
                                value={heatmapSelectedDate}
                                onChange={(e) => setHeatmapSelectedDate(e.target.value)}
                                label="Select Date"
                            >
                                {availableDates.map(date => (
                                    <MenuItem key={date} value={date}>{date}</MenuItem>
                                ))}
                            </Select>
                        </StyledFormControl>
                        <HeatmapContainer>
                            <ReactApexChart options={options} series={series} type="heatmap" height={400} />
                        </HeatmapContainer>

                        <Typography variant="h5" align="center" mt={4}>Details</Typography>
                        {selectedDetails.length > 0 && (
                            <TableWrapper>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ borderBottom: 'solid 3px #ddd', background: '#f2f2f2', color: 'black', fontWeight: 'bold', padding: '8px' }}>No</th>
                                            <th style={{ borderBottom: 'solid 3px #ddd', background: '#f2f2f2', color: 'black', fontWeight: 'bold', padding: '8px' }}>Timestamp</th>
                                            <th style={{ borderBottom: 'solid 3px #ddd', background: '#f2f2f2', color: 'black', fontWeight: 'bold', padding: '8px' }}>Behavior</th>
                                            <th style={{ borderBottom: 'solid 3px #ddd', background: '#f2f2f2', color: 'black', fontWeight: 'bold', padding: '8px' }}>Process</th>
                                            <th style={{ borderBottom: 'solid 3px #ddd', background: '#f2f2f2', color: 'black', fontWeight: 'bold', padding: '8px' }}>Subsystem</th>
                                            <th style={{ borderBottom: 'solid 3px #ddd', background: '#f2f2f2', color: 'black', fontWeight: 'bold', padding: '8px' }}>Original Event</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedDetails.map((detail, index) => (
                                            <tr key={index}>
                                                <td style={{ padding: '8px', borderBottom: 'solid 1px #ddd', textAlign: 'left' }}>{index + 1}</td>
                                                <td style={{ padding: '8px', borderBottom: 'solid 1px #ddd', textAlign: 'left' }}>{detail.timestamp}</td>
                                                <td style={{ padding: '8px', borderBottom: 'solid 1px #ddd', textAlign: 'left' }}>{detail.behavior}</td>
                                                <td style={{ padding: '8px', borderBottom: 'solid 1px #ddd', textAlign: 'left' }}>{detail.process}</td>
                                                <td style={{ padding: '8px', borderBottom: 'solid 1px #ddd', textAlign: 'left' }}>{detail.subsystem}</td>
                                                <td style={{ padding: '8px', borderBottom: 'solid 1px #ddd', textAlign: 'left' }}>{detail.originalEventMessage}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </TableWrapper>
                        )}




                        <Typography variant="h5" align="center" mt={4}>Timelines</Typography>
                        <TimelineComponent
                            events={data || []}
                            eventTypeColors={EVENT_TYPE_COLORS}
                            availableDates={availableDates}
                            selectedDate={timelineSelectedDate}
                            onDateChange={setTimelineSelectedDate}
                        />

                        
                    </>
                )}
            </StyledContainer>
        </ThemeProvider>
    );
};

export default App;
