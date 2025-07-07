const express = require('express');
const multer = require('multer');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });


// File Upload Endpoint
app.post('/upload', upload.single('file'), (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  res.json({ message: 'File uploaded successfully', file: `/uploads/${req.file.filename}` });
});

// Weather API Endpoint
app.get('/weather/:city', async (req, res, next) => {
  const { city } = req.params;
  const apiKey = process.env.OPENWEATHER_API_KEY;

  try {
    const result = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
      params: { q: city, appid: apiKey, units: 'metric' }
    });
    res.json(result.data);
  } catch (err) {
    next(err);
  }
});

// Sample Error Endpoint
app.get('/error', (req, res, next) => {
  next(new Error('Intentional error for testing'));
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
