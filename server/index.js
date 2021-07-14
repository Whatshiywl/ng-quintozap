const fs = require('fs');
if (fs.existsSync('.env')) {
  require('dotenv').config();
}

const path = require('path');
const express = require('express');
const zapRouter = require('./routers/zap.router');
const quintoRouter = require('./routers/quinto.router');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.use('/', express.static(path.join(__dirname, '..', 'dist', 'ng-quintozap')));

app.get('/api/googlemapsapikey', (_, res) => {
  res.send(process.env.MAPS_API_KEY || '');
});

app.use('/api/zap', zapRouter);
app.use('/api/quinto', quintoRouter);

app.listen(port, () => console.log(`Express listening to port ${port}`));
