const express = require('express');
const { postAGenre, getAllGenres, getSingleGenre, updateGenre, deleteAGenre } = require('./genre.controller');
const verifyAdminToken = require('../middleware/verifyAdminToken');
const router = express.Router();

router.post("/create-genre", verifyAdminToken, postAGenre)
router.get("/", getAllGenres);
router.get("/:id", getSingleGenre);
router.put("/edit/:id", verifyAdminToken, updateGenre);
router.delete("/:id", verifyAdminToken, deleteAGenre)

module.exports = router;

