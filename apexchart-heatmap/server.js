const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const moment = require('moment');

const app = express();
app.use(cors());
app.use(express.static('public'));

const port = 5001;

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.originalname.endsWith('.db')) {
            cb(null, 'uploads/');
        } else {
            cb(null, 'public/');
        }
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// API to handle file uploads
app.post('/upload', upload.fields([
    { name: 'ULD', maxCount: 1 },
    { name: 'locationwifi', maxCount: 1 },
    { name: 'recentfile', maxCount: 1 }
]), (req, res) => {
    const dbFile = req.files.ULD ? req.files.ULD[0] : null;
    const locationWifiFile = req.files.locationwifi ? req.files.locationwifi[0] : null;
    const recentFile = req.files.recentfile ? req.files.recentfile[0] : null;

    if (!dbFile) {
        return res.status(400).send('No database file uploaded.');
    }

    res.status(200).json({
        message: 'Files uploaded successfully',
        dbFile: dbFile ? dbFile.filename : null,
        locationWifiFile: locationWifiFile ? locationWifiFile.filename : null,
        recentFile: recentFile ? recentFile.filename : null,
    });
});

// API to get data from the database
app.get('/api/data', (req, res) => {
    const dbFilePath = './uploads/ULD.db'; // Change this to your actual db file path

    if (!fs.existsSync(dbFilePath)) {
        return res.status(404).send('Database file not found.');
    }

    const db = new sqlite3.Database(dbFilePath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
            console.error('Error opening database:', err.message);
            res.status(500).send('Error opening database');
            return;
        }

        const query = `
        SELECT Category, Data_Type, Data_Type_User_behavior, Timestamp, Subsystem, Process, Original_eventMessage
        FROM User_behavior
        WHERE 
            (Data_Type = 'Power' 
            AND Data_Type_User_behavior IN (
                'System On', 'System Restart', 'System Off(Command)', 'System Off(Dialog)',
                'System Off(Dialog-countdown)', 'System Restart(Command)', 'System Restart(Dialog)', 
                'System Restart(Dialog-countdown)'
            )
            ) OR 
            (Data_Type = 'SleepMode' 
            AND Data_Type_User_behavior IN ('Idle', 'Sleep', 'Wake')
            ) OR 
            (Data_Type = 'ScreenLock' 
            AND Data_Type_User_behavior IN ('Triggered', 'Login Success', 'Login Failed')
            ) OR 
            (Data_Type = 'Peripheral' 
            AND Data_Type_User_behavior IN ('Attach', 'Detach-Physical', 'Detach-Logical', 'Camera-On', 'Camera-Off')
            ) OR 
            (Data_Type = 'Wifi' 
            AND Data_Type_User_behavior IN (
                'Wifi-On', 'Wifi-On(ControlCenter)', 'Wifi-Off', 'Wifi-Off(ControlCenter)', 
                'Wifi-Connect-Initial', 'Wifi-Connect-When not', 'Wifi-Connect-When already connect', 
                'Wifi-Disconnect', 'Wifi-Register Network', 'Wifi-Delete Network'
            )
            ) OR 
            (Data_Type = 'Bluetooth' 
            AND Data_Type_User_behavior IN (
                'Bluetooth-On', 'Bluetooth-Off', 'Bluetooth-Connect-Scanning', 
                'Bluetooth-Connect-Initial', 'Bluetooth-Connect', 'Bluetooth-DisConnect',
                'Bluetooth-DisConnected By User', 'Bluetooth-DisConnected By Remote Device', 'Bluetooth-Delete Device'
            )
            ) OR 
            (Data_Type = '[-]' 
            AND Data_Type_User_behavior IN (
                'App-Install', 'App-Execute', 'App-Quit'
            )
            ) OR 
            (Data_Type = 'from AppStore' 
            AND Data_Type_User_behavior IN (
                'App-Install-AppStore', 'App-UnInstall-AppStore'
            )
            ) OR 
            (Data_Type = 'from Internet' 
            AND Data_Type_User_behavior IN (
                'App-Initial Execute-Internet', 'App-UnInstall-Internet'
            )
            ) OR 
            (Data_Type = 'Document' 
            AND Data_Type_User_behavior = 'Document-Recently Used'
            ) OR 
            (Data_Type = 'Photo' 
            AND Data_Type_User_behavior IN (
                'ScreenCapture(or Record)'
            )) OR
            (Data_Type = 'Video' 
            AND Data_Type_User_behavior IN (
                'ScreenRecord-Start', 'ScreenRecord-End'
            ));
        `;

        db.all(query, [], (err, rows) => {
            if (err) {
                console.error('Database query error:', err);
                res.status(500).send(err);
                return;
            }

            if (rows.length === 0) {
                console.log('No data found for the specified query.');
                res.json([]);
                return;
            }

            const transformedData = rows.map(row => {
                const formattedTime = moment(row.Timestamp).utcOffset('+09:00').format('YYYY-MM-DD HH:mm:ss.SSS');
                return {
                    Category: row.Category,
                    Data_Type: row.Data_Type,
                    Data_Type_User_behavior: row.Data_Type_User_behavior,
                    Timestamp: formattedTime,
                    Subsystem: row.Subsystem,
                    Process: row.Process,
                    Original_eventMessage: row.Original_eventMessage,
                    Combined_Type: `${row.Category}-${row.Data_Type}`  // Combine Category and Data_Type here
                };
            });

            console.log('Sending transformed data:', transformedData);
            db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                }
            });
            res.json(transformedData);
        });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
