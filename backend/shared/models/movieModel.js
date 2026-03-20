import mongoose from 'mongoose';

const movieSchema = mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now()
  },
  movieId: String,
  titleOriginal: String,
  country: String,
  language: String,
  year: String,
  genre: String,
  length: String,
  director: String,
  actors: String,
  description: String,
  image: String,
  youtubeId: String,
});

const Movie = mongoose.model('Movie', movieSchema);

export default Movie;