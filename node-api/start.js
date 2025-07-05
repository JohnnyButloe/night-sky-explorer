import app from './server.js';

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Node.js API running on port ${PORT}`);
});
