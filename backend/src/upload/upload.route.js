const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { uploadImage, uploadAudio } = require('./upload.controller');
const { deleteFile, deleteAudioFile, deleteRawFile } = require('./delete.controller');
const verifyAdminToken = require('../middleware/verifyAdminToken');

router.post('/image', verifyAdminToken, upload.single('file'), uploadImage);
router.post('/audio', verifyAdminToken, upload.single('file'), uploadAudio);
router.delete('/delete', verifyAdminToken, deleteFile);
router.delete('/delete-audio', verifyAdminToken, deleteAudioFile);
router.delete('/delete-raw', verifyAdminToken, deleteRawFile);

module.exports = router;

