const express = require("express");
const router = express.Router();
const Bus = require("../models/Bus");

// Create Bus
router.post("/", async (req, res) => {
  try {
    const { name, from, to, acType, seatType, seats, price, time, startDate, endDate } = req.body;
    if (!name || !from || !to || !acType || !seatType || !seats || !price || !time || !startDate || !endDate) {
      return res.status(400).json({ message: "All fields required" });
    }
    const bus = new Bus({
      name, from, to, acType, seatType, seats, price, time, bookedSeats: {}, startDate, endDate
    });
    await bus.save();
    res.status(201).json(bus);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all active buses (today or future)
router.get("/", async (req, res) => {
  try {
    const today = new Date();
    const buses = await Bus.find({ endDate: { $gte: today } });
    res.json(buses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get bus by ID
router.get("/:id", async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) return res.status(404).json({ message: "Bus not found" });
    res.json(bus);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update bus
router.put("/:id", async (req, res) => {
  try {
    const { name, from, to, acType, seatType, seats, price, time, bookedSeats, startDate, endDate } = req.body;
    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      { name, from, to, acType, seatType, seats, price, time, bookedSeats, startDate, endDate },
      { new: true }
    );
    if (!bus) return res.status(404).json({ message: "Bus not found" });
    res.json(bus);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete bus
router.delete("/:id", async (req, res) => {
  try {
    const bus = await Bus.findByIdAndDelete(req.params.id);
    if (!bus) return res.status(404).json({ message: "Bus not found" });
    res.json({ message: "Bus deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Book seats by date (user or admin)
router.post("/:id/book", async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) return res.status(404).json({ message: "Bus not found" });

    const { seatsToBook, date } = req.body;
    const bookingDate = date || new Date().toISOString().split("T")[0];

    if (!bus.bookedSeats) {
      bus.bookedSeats = {};
    }

    const isMap = typeof bus.bookedSeats.get === "function";
    const existing = isMap
      ? (bus.bookedSeats.get(bookingDate) || [])
      : (bus.bookedSeats[bookingDate] || []);

    const alreadyBooked = seatsToBook.some(seat => existing.includes(seat));
    if (alreadyBooked) return res.status(400).json({ message: "Some seats are already booked" });

    const updated = [...existing, ...seatsToBook];
    if (isMap) {
      bus.bookedSeats.set(bookingDate, updated);
    } else {
      bus.bookedSeats[bookingDate] = updated;
    }

    await bus.save();
    const result = isMap ? bus.bookedSeats.get(bookingDate) : bus.bookedSeats[bookingDate];
    res.json({ bookedSeats: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reset seats for today (manual endpoint)
router.put("/reset/daily", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const buses = await Bus.find({ endDate: { $gte: new Date() } });
    for (const bus of buses) {
      if (!bus.bookedSeats) bus.bookedSeats = {};
      if (typeof bus.bookedSeats.set === "function") {
        bus.bookedSeats.set(today, []);
      } else {
        bus.bookedSeats[today] = [];
      }
      await bus.save();
    }
    res.json({ message: "Daily reset done" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
