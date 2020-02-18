const mongoose = require("mongoose");

const Service = mongoose.model("Service", {
  title: String,
  description: String,
  photos: [String],
  price: Number, // Tarif horaire
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
  ]
});

module.exports = Service;
