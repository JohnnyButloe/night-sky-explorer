import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv'; // if you use dotenv
import locationsRouter from './routes/locations.js';
import celestialRouter from './routes/celestial.js';
import weatherRouter from './routes/weather.js';
// import userRouter from './routes/user.js'; // if user routes are being used

dotenv.config(); // load .env if needed

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/locations', locationsRouter);
app.use('/api/celestial', celestialRouter);
app.use('/api/weather', weatherRouter);
// app.use('/api/user', userRouter);

export default app;
