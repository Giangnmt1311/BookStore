const Author = require("./author.model");
const mongoose = require('mongoose');

const postAnAuthor = async (req, res) => {
    try {
        console.log("Creating author with data:", req.body);
        
        const newAuthor = new Author({...req.body});
        await newAuthor.save();
        res.status(200).send({message: "Author posted successfully", author: newAuthor})
    } catch (error) {
        console.error("Error creating author", error);
        
        if (error.code === 11000) {
            return res.status(400).send({
                message: "Duplicate entry found",
                error: "An author with this name already exists"
            });
        }
        
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).send({
                message: "Validation failed",
                errors: validationErrors
            });
        }
        
        res.status(500).send({message: "Failed to create author", error: error.message})
    }
}

const getAllAuthors = async (req, res) => {
    try {
        const authors = await Author.find().sort({ createdAt: -1});
        res.status(200).send(authors)
    } catch (error) {
        console.error("Error fetching authors", error);
        res.status(500).send({message: "Failed to fetch authors"})
    }
}

const getSingleAuthor = async (req, res) => {
    try {
        const {id} = req.params;
        const author = await Author.findById(id);
        if(!author){
            return res.status(404).send({message: "Author not Found!"})
        }
        res.status(200).send(author)
    } catch (error) {
        console.error("Error fetching author", error);
        res.status(500).send({message: "Failed to fetch author"})
    }
}

const updateAuthor = async (req, res) => {
    try {
        const {id} = req.params;
        const updatedAuthor = await Author.findByIdAndUpdate(id, req.body, {new: true});
        if(!updatedAuthor) {
            return res.status(404).send({message: "Author is not Found!"})
        }
        res.status(200).send({
            message: "Author updated successfully",
            author: updatedAuthor
        })
    } catch (error) {
        console.error("Error updating an author", error);
        res.status(500).send({message: "Failed to update an author"})
    }
}

const deleteAnAuthor = async (req, res) => {
    try {
        const {id} = req.params;
        const deletedAuthor = await Author.findByIdAndDelete(id);
        if(!deletedAuthor) {
            return res.status(404).send({message: "Author is not Found!"})
        }
        res.status(200).send({
            message: "Author deleted successfully",
            author: deletedAuthor
        })
    } catch (error) {
        console.error("Error deleting an author", error);
        res.status(500).send({message: "Failed to delete an author"})
    }
};

module.exports = {
    postAnAuthor,
    getAllAuthors,
    getSingleAuthor,
    updateAuthor,
    deleteAnAuthor
}

