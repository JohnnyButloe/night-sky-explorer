import express from 'express';
import dotenv from 'dotenv'; // if you use dotenv
import astroProxy from './routes/astroProxy.js';
import locationsRouter from './routes/locations.js';
import celestialRouter from './routes/celestial.js';
import weatherRouter from './routes/weather.js';
// import userRouter from './routes/user.js'; // if user routes are being used

dotenv.config(); // load .env if needed

const app = express();
app.use(express.json());

app.use('/api/locations', locationsRouter);
app.use('/api/astro', astroProxy);
app.use('/api/celestial', celestialRouter);
app.use('/api/weather', weatherRouter);
// app.use('/api/user', userRouter);

export default app;
