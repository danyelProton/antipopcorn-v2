import express, { json } from 'express';
import mongoose from 'mongoose';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import Program from '../shared/models/programModel.js';
import { logError } from '../shared/utils.js';


// handling uncaught exceptions - nehandlovane errors (bugs) v sync kode (napr. console.log neexistujucej premennej) - vtedy netreba cakat na ukoncenie servera
process.on('uncaughtException', err => {
  console.log(err);
  process.exit(1);
});

try {
  const DB = process.env.DATABASE.replace('<db_password>', process.env.DATABASE_PASSWORD);
  await mongoose.connect(DB);
  console.log('DB connection successful');
} catch(err) {
  logError('db_connection', err);
  return;
}

const app = express();

app.use(helmet());

// dopln url ked bude frontend
app.use(cors({
  origin: 'https://antipopcorn.netlify.app'
}));

app.use(express.json({ limit: '10kb' }));
app.use(compression());

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.get('/api/program', async (req, res) => {
  try {
    const program = await Program.find();
    // console.log(program);

    res.status(200).json({
      status: 'success',
      data: program
    });
  } catch(err) {
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong'
    });
  }
});

app.all('/{*path}', (req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `404 - Can't find ${req.originalUrl} on this server`
  });
});

if (process.env.NODE_ENV === 'development') {
  const port = process.env.PORT || 3000;
  const host = process.env.HOST || 'localhost';
  const server = app.listen(port, host, () => console.log(`Listening to requests on port ${port}`));
}

// handling unhandled promise rejections - nehandlovane errors v async kode - napr. chyba pri connectnuti databazy; exitneme process, ale az vtedy ked server ukoncil vsetky pending alebo prebiehajuce tasky (process.exit je executed az ked je server closed)
process.on('unhandledRejection', err => {
  console.log(err);
  server.close(() => {
    process.exit(1);
  });
});

// handlovanie SIGTERM - signal, ktory posielaju niektore hostingy, aby ukoncili proces - napr. kde sa deployuje novy kod; nepouzivame process.exit(), lebo uz samotny SIGTERM sposobi ukoncenie aplikacie
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully.');
  server.close(() => {
    console.log('Process terminated.');
  });
});


export default app;