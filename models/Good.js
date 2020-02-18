const mongoose = require("mongoose");

const Good = mongoose.model("Good", {
  title: String,
  description: String,
  photos: [String],
  ratings: [
    {
      userId: String,
      summary: String,
      detail: String,
      numberOfStars: Number,
      created: {
        type: Date,
        default: Date.now
      }
    }
  ],
  address: String,
  loc: {
    type: [Number], // Longitude et latitude
    index: "2dsphere" // Créer un index geospatial https://docs.mongodb.com/manual/core/2dsphere/
  }
});

module.exports = Good;
