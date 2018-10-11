const express = require('express');
const app = express();

app.get('/teste/:param1', (req, res, next) => {
    console.log(
        { headers: req.headers, params: req.params, query: req.query, body: req.body }
    );

    res.status(200).json({
        ping: 'pong'
    });
});

app.listen(8090, () => {
    console.log('>>> 8090')
});