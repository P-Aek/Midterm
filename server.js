const express = require('express');
const app = express();
const cors = require('cors');
const morgan = require('morgan');
const { readdirSync } = require('fs');


// middelwares
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));



// routes
readdirSync('./routes').map((r) => app.use('/api', require(`./routes/${r}`)));


// server
app.listen(5001, () => {
    console.log('Server is running on port 5001');
});