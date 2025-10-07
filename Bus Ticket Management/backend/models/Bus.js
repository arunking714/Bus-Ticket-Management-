const mongoose = require("mongoose");

const BusSchema = new mongoose.Schema({
  name: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  acType: { type: String, required: true },
  seatType: { type: String, required: true },
  seats: { type: Number, required: true },
  price: { type: Number, required: true },
  time: { type: String, required: true },  // new field, e.g. "10:30 AM"
  // store bookings keyed by date: { "2025-10-07": ["S1","U4"] }
  bookedSeats: {
    type: Map,
    of: [String],
    default: {}
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
});

module.exports = mongoose.model("Bus", BusSchema);
