const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb'); // Import ObjectId separately
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// MongoDB connection string
const uri = "mongodb+srv://bappy:Amihscdimo@cluster0.uxwhh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error(err);
  }
}

run();

// GET endpoint to fetch a specific review by ID
app.get('/review/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const database = client.db('gameReviews');
    const reviewsCollection = database.collection('reviews');

    // Use ObjectId to convert the string id to a MongoDB ObjectId
    const review = await reviewsCollection.findOne({ _id: new ObjectId(id) });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.status(200).json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching review details' });
  }
});

// POST endpoint to add a review
app.post('/add-review', async (req, res) => {
  const { gameCover, gameTitle, reviewDescription, rating, publishYear, genres, userEmail, userName } = req.body;

  // Validate required fields
  if (!gameCover || !gameTitle || !reviewDescription || !publishYear || !genres || !userEmail || !userName) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
  }

  // Ensure genres is an array
  const validGenres = Array.isArray(genres) ? genres : genres ? [genres] : [];

  // Create the review object
  const review = {
    gameCover,
    gameTitle,
    reviewDescription,
    rating,
    publishYear,
    genres: validGenres,  // Use the validated genres
    userEmail,
    userName,
    date: new Date(),
  };

  try {
    // Get the database and collection
    const database = client.db('gameReviews');
    const reviewsCollection = database.collection('reviews');

    // Insert the review into the collection
    await reviewsCollection.insertOne(review);
    res.status(200).json({ message: 'Review added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding review' });
  }
});

// GET endpoint to fetch all reviews
app.get('/reviews', async (req, res) => {
  try {
    // Get the database and collection
    const database = client.db('gameReviews');
    const reviewsCollection = database.collection('reviews');

    // Fetch all reviews
    const reviews = await reviewsCollection.find().toArray();

    // Return the reviews as a response
    res.status(200).json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
});

// PUT endpoint to update a review by ID
app.put('/reviews/:id', async (req, res) => {
  const { id } = req.params;
  const { gameCover, gameTitle, reviewDescription, rating, publishYear, genres, userEmail, userName } = req.body;

  // Validate required fields
  if (!gameCover || !gameTitle || !reviewDescription || !publishYear || !genres || !userEmail || !userName) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
  }

  // Prepare the updated review object
  const updatedReview = {
    gameCover,
    gameTitle,
    reviewDescription,
    rating,
    publishYear,
    genres, // genres should already be an array
    userEmail,
    userName,
    date: new Date(), // Optionally update the date of the review
  };

  try {
    const database = client.db('gameReviews');
    const reviewsCollection = database.collection('reviews');

    // Convert the string ID to ObjectId for MongoDB query
    const objectId = new ObjectId(id);

    // Update the review in the database
    const result = await reviewsCollection.updateOne(
      { _id: objectId },
      { $set: updatedReview }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.status(200).json({ message: 'Review updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating review' });
  }
});

// DELETE endpoint to remove a review by ID
app.delete('/reviews/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Get the database and collection
    const database = client.db('gameReviews');
    const reviewsCollection = database.collection('reviews');

    // Convert the string ID to ObjectId for MongoDB query
    const objectId = new ObjectId(id);

    // Delete the review from the collection
    const result = await reviewsCollection.deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting review' });
  }
});
// POST endpoint to add a game to the user's watchlist
app.post('/add-to-watchlist', async (req, res) => {
  const { userEmail, gameId, gameTitle, gameCover, rating, genres, publishYear } = req.body;

  // Validate required fields
  if (!userEmail || !gameId || !gameTitle || !gameCover || !rating || !publishYear || !genres) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  // Create a new watchlist entry
  const newGame = {
    userEmail,
    gameId,
    gameTitle,
    gameCover,
    rating,
    genres,
    publishYear,
    dateAdded: new Date(),
  };

  try {
    const database = client.db('gameReviews');
    const watchlistCollection = database.collection('watchlist');

    // Insert the new game into the user's watchlist
    await watchlistCollection.insertOne(newGame);
    res.status(200).json({ message: 'Game added to watchlist successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding game to watchlist' });
  }
});
app.get('/myWatchlist/:userEmail', async (req, res) => {
    const { userEmail } = req.params;
  
    try {
      const database = client.db('gameReviews');
      const watchlistCollection = database.collection('watchlist');
  
      const watchlist = await watchlistCollection.find({ userEmail }).toArray();
      res.status(200).json(watchlist);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error fetching watchlist' });
    }
  });
// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
