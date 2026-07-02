const express = require('express');
const { postAnAuthor, getAllAuthors, getSingleAuthor, updateAuthor, deleteAnAuthor } = require('./author.controller');
const verifyAdminToken = require('../middleware/verifyAdminToken');
const router = express.Router();

router.post("/create-author", verifyAdminToken, postAnAuthor)
router.get("/", getAllAuthors);
router.get("/:id", getSingleAuthor);
router.put("/edit/:id", verifyAdminToken, updateAuthor);
router.delete("/:id", verifyAdminToken, deleteAnAuthor)

module.exports = router;

