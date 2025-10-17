// src/server.js
const app = require("./app");
const mongoose = require("mongoose");
const { MONGODB_URI, PORT } = require("./config/config");
const { loadFaceApiModels } = require("./utils/faceApiLoader");

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then( async () => {
    console.log("Connected to MongoDB");
    await loadFaceApiModels();
    // Start server
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    // Handle unhandled promise rejections
    process.on("unhandledRejection", (err) => {
      console.log("UNHANDLED REJECTION! Shutting down...");
      console.log(err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });
  })
  .catch(err => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

