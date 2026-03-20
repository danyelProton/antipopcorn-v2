import mongoose from 'mongoose';

const programSchema = mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now()
  },
  cinemaShort: String,
  cinema: String,
  date: Date,
  day: String,
  month: String,
  weekday: String,
  time: String,
  title: String,
  movieId: String,
  id: String,
  url: String,
  movies: Array
});

const Program = mongoose.model('Program', programSchema);

export default Program;