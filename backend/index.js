const express = require("express");
const app = express();
const cors = require("cors");

const mongoose = require("mongoose");
const port = process.env.PORT || 5000;
require('dotenv').config()

// middleware
app.use(express.json());
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}))

// routes
const bookRoutes = require('./src/books/book.route');
const orderRoutes = require("./src/orders/order.route")
const adminRoutes = require('./src/admins/admin.route');
const userRoutes =  require("./src/users/user.route")
const chatRoutes = require('./src/chat/chat.route');
const reviewRoutes = require('./src/reviews/review.route');
const recommendationRoutes = require('./src/recommendations/recommendation.route');
const interactionRoutes = require('./src/interactions/interaction.route');
const bannerRoutes = require('./src/banners/banner.route');
const authorRoutes = require('./src/authors/author.route');
const genreRoutes = require('./src/genres/genre.route');
const uploadRoutes = require('./src/upload/upload.route');

app.use("/api/books", bookRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/auth/admin", adminRoutes)
app.use("/api/auth", userRoutes)
app.use("/api/chat", chatRoutes)
app.use("/api/reviews", reviewRoutes)
app.use("/api/recommendations", recommendationRoutes)
app.use("/api/interactions", interactionRoutes)
app.use("/api/banners", bannerRoutes)
app.use("/api/authors", authorRoutes)
app.use("/api/genres", genreRoutes)
app.use("/api/upload", uploadRoutes)

async function main() {
  await mongoose.connect(process.env.DB_URL);
  app.use("/", (req, res) => {
    res.send("Book Store Server is running!");
  });
}

main().then(() => console.log("Mongodb connect successfully!")).catch(err => console.log(err));

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
