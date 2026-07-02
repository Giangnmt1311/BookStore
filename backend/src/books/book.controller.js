const Book = require("./book.model");
const Order = require("../orders/order.model");
const Review = require("../reviews/review.model");
const mongoose = require('mongoose');
const escapeStringRegexp = (s) => s?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') || '';

const postABook = async (req, res) => {
    try {
        console.log("Creating book with data:", req.body);
        
        let publicationDate = null;
        if (req.body.publicationDate) {
            if (typeof req.body.publicationDate === 'string' && req.body.publicationDate.includes('/')) {
                const [day, month, year] = req.body.publicationDate.split('/');
                publicationDate = new Date(`${year}-${month}-${day}`);
            } else {
                publicationDate = new Date(req.body.publicationDate);
            }
        }
        
        const bookData = {
            ...req.body,
            stock: req.body.stock !== undefined ? Math.floor(Number(req.body.stock)) : 0,
            soldQuantity: 0,
            publicationDate: publicationDate || null,
        };
        
        const newBook = new Book(bookData);
        await newBook.save();
        res.status(200).send({message: "Book posted successfully", book: newBook})
    } catch (error) {
        console.error("Error creating book", error);
        
        if (error.code === 11000) {
            return res.status(400).send({
                message: "Duplicate entry found",
                error: "A record with this information already exists"
            });
        }
        
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).send({
                message: "Validation failed",
                errors: validationErrors
            });
        }
        
        res.status(500).send({message: "Failed to create book", error: error.message})
    }
}

const getAllBooks =  async (req, res) => {
    try {
        const books = await Book.find().populate('authorId').populate('genreId').sort({ createdAt: -1});
        
        const booksWithRatings = await Promise.all(books.map(async (book) => {
            const reviews = await Review.find({ productId: book._id.toString() });
            const ratings = reviews.map(r => r.rating);
            
            let averageRating = book.averageRating || 5;
            if (averageRating === 5 && ratings.length > 0) {
                averageRating = parseFloat((ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1));
            } else if (averageRating === 5 && ratings.length === 0) {
                averageRating = 5;
            }
            
            const bookObj = book.toObject();
            if (bookObj.authorId) {
                bookObj.author = bookObj.authorId.name || '';
                bookObj.authorBio = bookObj.authorId.bio || '';
            }
            if (bookObj.genreId) {
                bookObj.genres = bookObj.genreId.name || '';
            }
            
            return {
                ...bookObj,
                ratings: ratings.length > 0 ? ratings.map(r => ({ value: r })) : [],
                averageRating: averageRating,
                ratingCount: ratings.length
            };
        }));
        
        res.status(200).send(booksWithRatings)
        
    } catch (error) {
        console.error("Error fetching books", error);
        res.status(500).send({message: "Failed to fetch books"})
    }
}

const getSingleBook = async (req, res) => {
    try {
        const {id} = req.params;
        const book = await Book.findById(id).populate('authorId').populate('genreId');
        if(!book){
            return res.status(404).send({message: "Book not Found!"})
        }
        
        const reviews = await Review.find({ productId: id });
        const ratings = reviews.map(r => r.rating);
        
        let averageRating = book.averageRating || 5;
        if (averageRating === 5 && ratings.length > 0) {
            averageRating = parseFloat((ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1));
        } else if (averageRating === 5 && ratings.length === 0) {
            averageRating = 5;
        }
        
        const bookObj = book.toObject();
        if (bookObj.authorId) {
            bookObj.author = bookObj.authorId.name || '';
            bookObj.authorBio = bookObj.authorId.bio || '';
        }
        if (bookObj.genreId) {
            bookObj.genres = bookObj.genreId.name || '';
        }
        
        const bookWithRatings = {
            ...bookObj,
            ratings: ratings.length > 0 ? ratings.map(r => ({ value: r })) : [],
            averageRating: averageRating,
            ratingCount: ratings.length
        };
        
        res.status(200).send(bookWithRatings)
        
    } catch (error) {
        console.error("Error fetching book", error);
        res.status(500).send({message: "Failed to fetch book"})
    }

}


const UpdateBook = async (req, res) => {
    try {
        const {id} = req.params;
        
        const updateData = {...req.body};
        if (updateData.stock !== undefined) {
            updateData.stock = Math.floor(Number(updateData.stock));
        }
        delete updateData.soldQuantity;
        
        if (updateData.publicationDate) {
            if (typeof updateData.publicationDate === 'string' && updateData.publicationDate.includes('/')) {
                const [day, month, year] = updateData.publicationDate.split('/');
                updateData.publicationDate = new Date(`${year}-${month}-${day}`);
            } else {
                updateData.publicationDate = new Date(updateData.publicationDate);
            }
        }
        
        const updatedBook = await Book.findByIdAndUpdate(id, updateData, {new: true});
        if(!updatedBook) {
            return res.status(404).send({message: "Book is not Found!"})
        }
        res.status(200).send({
            message: "Book updated successfully",
            book: updatedBook
        })
    } catch (error) {
        console.error("Error updating a book", error);
        res.status(500).send({message: "Failed to update a book"})
    }
}

const deleteABook = async (req, res) => {
    try {
        const {id} = req.params;
        const deletedBook = await Book.findByIdAndDelete(id);
        if(!deletedBook) {
            return res.status(404).send({message: "Book is not Found!"})
        }
        res.status(200).send({
            message: "Book deleted successfully",
            book: deletedBook
        })
    } catch (error) {
        console.error("Error deleting a book", error);
        res.status(500).send({message: "Failed to delete a book"})
    }
};

const toggleFeatured = async (req, res) => {
    try {
        const {id} = req.params;
        console.log("Toggling featured status for book ID:", id);
        
        const book = await Book.findById(id);
        if(!book) {
            return res.status(404).send({message: "Book not Found!"})
        }
        
        book.featured = !book.featured;
        await book.save();
        
        console.log("Featured status updated successfully:", book.featured);
        res.status(200).send({
            message: `Book ${book.featured ? 'featured' : 'unfeatured'} successfully`,
            book: book
        })
    } catch (error) {
        console.error("Error toggling featured status", error);
        res.status(500).send({message: "Failed to toggle featured status", error: error.message})
    }
};

const getBestSellers = async (req, res) => {
    try {
        const bestSellersData = await Order.aggregate([
            { $match: { completed: true } },
            { $unwind: "$products" },
            { 
                $group: {
                    _id: "$products.productId",
                    totalQuantity: { $sum: "$products.quantity" },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 20 }
        ]);

        const bookIds = bestSellersData.map(item => item._id);
        const books = await Book.find({ _id: { $in: bookIds } }).populate('authorId').populate('genreId');

        const salesDataMap = {};
        bestSellersData.forEach(item => {
            salesDataMap[item._id.toString()] = {
                orderCount: item.orderCount,
                totalQuantity: item.totalQuantity || item.orderCount
            };
        });

        const bestSellers = await Promise.all(books.map(async (book) => {
            const reviews = await Review.find({ productId: book._id.toString() });
            const ratings = reviews.map(r => r.rating);
            
            let averageRating = book.averageRating || 5;
            if (averageRating === 5 && ratings.length > 0) {
                averageRating = parseFloat((ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1));
            } else if (averageRating === 5 && ratings.length === 0) {
                averageRating = 5;
            }
            
            const bookObj = book.toObject();
            if (bookObj.authorId) {
                bookObj.author = bookObj.authorId.name || '';
                bookObj.authorBio = bookObj.authorId.bio || '';
            }
            if (bookObj.genreId) {
                bookObj.genres = bookObj.genreId.name || '';
            }
            
            return {
                ...bookObj,
                orderCount: salesDataMap[book._id.toString()]?.orderCount || 0,
                totalQuantity: salesDataMap[book._id.toString()]?.totalQuantity || 0,
                ratings: ratings.length > 0 ? ratings.map(r => ({ value: r })) : [],
                averageRating: averageRating,
                ratingCount: ratings.length
            };
        }));

        bestSellers.sort((a, b) => b.totalQuantity - a.totalQuantity);
        res.status(200).send(bestSellers);
    } catch (error) {
        console.error("Error fetching best sellers", error);
        res.status(500).send({message: "Failed to fetch best sellers"});
    }
};

module.exports = {
    postABook,
    getAllBooks,
    getSingleBook,
    UpdateBook,
    deleteABook,
    toggleFeatured,
    getBestSellers
}