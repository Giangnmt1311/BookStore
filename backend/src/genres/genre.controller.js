const Genre = require("./genre.model");
const mongoose = require('mongoose');

const postAGenre = async (req, res) => {
    try {
        console.log("Creating genre with data:", req.body);
        
        const newGenre = new Genre({...req.body});
        await newGenre.save();
        res.status(200).send({message: "Genre posted successfully", genre: newGenre})
    } catch (error) {
        console.error("Error creating genre", error);
        
        if (error.code === 11000) {
            return res.status(400).send({
                message: "Duplicate entry found",
                error: "A genre with this name already exists"
            });
        }
        
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).send({
                message: "Validation failed",
                errors: validationErrors
            });
        }
        
        res.status(500).send({message: "Failed to create genre", error: error.message})
    }
}

const getAllGenres = async (req, res) => {
    try {
        const genres = await Genre.find().sort({ createdAt: -1});
        res.status(200).send(genres)
    } catch (error) {
        console.error("Error fetching genres", error);
        res.status(500).send({message: "Failed to fetch genres"})
    }
}

const getSingleGenre = async (req, res) => {
    try {
        const {id} = req.params;
        const genre = await Genre.findById(id);
        if(!genre){
            return res.status(404).send({message: "Genre not Found!"})
        }
        res.status(200).send(genre)
    } catch (error) {
        console.error("Error fetching genre", error);
        res.status(500).send({message: "Failed to fetch genre"})
    }
}

const updateGenre = async (req, res) => {
    try {
        const {id} = req.params;
        const updatedGenre = await Genre.findByIdAndUpdate(id, req.body, {new: true});
        if(!updatedGenre) {
            return res.status(404).send({message: "Genre is not Found!"})
        }
        res.status(200).send({
            message: "Genre updated successfully",
            genre: updatedGenre
        })
    } catch (error) {
        console.error("Error updating a genre", error);
        res.status(500).send({message: "Failed to update a genre"})
    }
}

const deleteAGenre = async (req, res) => {
    try {
        const {id} = req.params;
        const deletedGenre = await Genre.findByIdAndDelete(id);
        if(!deletedGenre) {
            return res.status(404).send({message: "Genre is not Found!"})
        }
        res.status(200).send({
            message: "Genre deleted successfully",
            genre: deletedGenre
        })
    } catch (error) {
        console.error("Error deleting a genre", error);
        res.status(500).send({message: "Failed to delete a genre"})
    }
};

module.exports = {
    postAGenre,
    getAllGenres,
    getSingleGenre,
    updateGenre,
    deleteAGenre
}

