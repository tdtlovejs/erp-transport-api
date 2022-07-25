require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const route = require('./routes');
const cors = require('cors');
const path = require('path');
const mainRouter = require("./routes");
const gpsPointController = require('./controllers/gpsPoint')
const {errorHandler} = require('./middlewares/errorHandler')
const bodyParser = require("body-parser");

var corsOptions = {
    origin: "*",
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));
// app.use(bodyParser.json({limit: '150mb'}));
// app.use(express.urlencoded({
//     limit: '150mb',
//     extended: true
// }));

app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(process.env.MONGO_URI, {
	useUnifiedTopology: true,
	useNewUrlParser: true,
    useFindAndModify: false
});

const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.once('open', () => console.log('Connected to MongoDB'));
// app.use(express.limit('10M'));

app.use(express.json());
app.use(cors());
app.use("/", mainRouter);
app.use(errorHandler);
const  http  =  require('http').createServer(app);
const io = require("socket.io")(http, {
    cors: {
        origin: "*",
    }
});
// io.on('connection', (socket) => {
//     // socket.on('chat message', msg => {
//     //     io.emit('chat message', msg);
//     // });
// });
global._io  =  io;  // cach 2

global._io.on('connection',  (socket) => {
    socket.emit("getId", socket.id);

    socket.on('disconnect',  ()  =>  {
        console.log(`User disconnect id is ${socket.id}`);
    })
})

// app.use( (req, res, next) => {
//     res.io = io;
//     next()
// })

http.listen(process.env.PORT || 4000, '0.0.0.0',() => console.log('Server Started'));
