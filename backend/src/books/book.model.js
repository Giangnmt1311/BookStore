const mongoose =  require('mongoose');

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description:  {
        type: String,
        required: true,
    },
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'author',
        required: true,
    },
    genreId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'genre',
        required: true,
    },
    isbn: {
        type: String,
        default: '',
    },
    pages: {
        type: Number,
        default: 0,
    },
    publisher: {
        type: String,
        default: '',
    },
    language: {
        type: String,
        default: '',
    },
    publicationDate: {
        type: Date,
        default: null,
    },
    ageRating: {
        type: String,
        default: '',
    },
    featured: {
        type: Boolean,
        default: false,
    },
    coverImage: {
        type: String,
        required: true,
    },
    oldPrice: {
        type: Number,
        required: true,
    },
    newPrice: {
        type: Number,
        required: true,
    },
    audioFile: {
        type: String,
        default: '',
    },
    sampleFile: {
        type: String,
        default: '',
    },
    stock: {
        type: Number,
        default: 0,
        min: 0,
    },
    soldQuantity: {
        type: Number,
        default: 0,
        min: 0,
    },
    averageRating: {
        type: Number,
        default: 5,
        min: 0,
        max: 5,
    },
    reviewsCount: {
        type: Number,
        default: 0,
        min: 0,
    },
  }, {
    timestamps: true,
  });

  bookSchema.pre('save', function(next) {
    if (this.stock !== undefined && this.stock !== null) {
      this.stock = Math.floor(this.stock);
    }
    if (this.soldQuantity !== undefined && this.soldQuantity !== null) {
      this.soldQuantity = Math.floor(this.soldQuantity);
    }
    next();
  });

  const Book = mongoose.model('book', bookSchema, 'book');

  module.exports = Book;