import React, { useEffect, useState } from "react";
import axios from "./api";

const Seating = ({ busId }) => {
  const [bus, setBus] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch bus details including bookedSeats
  const fetchBus = async () => {
    try {
      const res = await axios.get(`/buses/${busId}`);
      setBus(res.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching bus:", error.response?.data || error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBus();
  }, [busId]);

  const toggleSeat = (seatId) => {
    if (!bus) return;
    if (bus.bookedSeats.includes(seatId.toString())) return; // prevent selecting booked seat
    setSelectedSeats((prev) =>
      prev.includes(seatId)
        ? prev.filter((id) => id !== seatId)
        : [...prev, seatId]
    );
  };

  const handleBooking = async () => {
    if (!bus || selectedSeats.length === 0) return;

    try {
      // Prepare data to update without extra fields
      const updatedBusData = {
        name: bus.name,
        from: bus.from,
        to: bus.to,
        date: bus.date,
        acType: bus.acType,
        seatType: bus.seatType,
        seats: bus.seats,
        price: bus.price,
        bookedSeats: [...bus.bookedSeats, ...selectedSeats.map(String)],
      };

      await axios.put(`/buses/${bus._id}`, updatedBusData);
      alert("Booking confirmed!");
      setSelectedSeats([]);
      fetchBus(); // refresh bus info after booking
    } catch (error) {
      console.error("Error booking seats:", error.response?.data || error.message);
    }
  };

  if (loading) return <p>Loading bus data...</p>;
  if (!bus) return <p>Bus not found</p>;

  // Generate seats with booking status
  const seats = Array.from({ length: bus.seats }, (_, i) => ({
    id: i + 1,
    price: i % 2 === 0 ? bus.price : bus.price + 50, // price variation
    isBooked: bus.bookedSeats.includes((i + 1).toString()),
  }));

  const totalPrice = selectedSeats.reduce((sum, id) => {
    const seat = seats.find((s) => s.id === id);
    return sum + (seat ? seat.price : 0);
  }, 0);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-6">Choose Your Seats</h2>

      <div className="grid grid-cols-5 gap-6">
        {seats.map((seat, index) => {
          const isSelected = selectedSeats.includes(seat.id);

          if (index % 2 === 0 && index !== 0 && index % 10 === 0) {
            return <div key={`aisle-${index}`} className="col-span-1"></div>;
          }

          return (
            <div key={seat.id} className="flex flex-col items-center col-span-1">
              <button
                disabled={seat.isBooked}
                onClick={() => toggleSeat(seat.id)}
                className={`w-12 h-16 rounded-md flex items-center justify-center border-2
                  ${
                    seat.isBooked
                      ? "bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed"
                      : isSelected
                      ? "bg-green-500 border-green-700 text-white"
                      : "bg-white border-green-600 hover:bg-green-100"
                  }`}
              >
                {seat.isBooked ? "X" : seat.id}
              </button>
              <span className="text-sm mt-1">{seat.isBooked ? "" : `₹${seat.price}`}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-8">
        <h3 className="font-semibold">Selected Seats:</h3>
        {selectedSeats.length === 0 ? (
          <p>No seats selected</p>
        ) : (
          <ul className="list-disc list-inside">
            {selectedSeats.map((id) => {
              const seat = seats.find((s) => s.id === id);
              return (
                <li key={id}>
                  Seat {id} – ₹{seat.price}
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-3 font-bold">Total Price: ₹{totalPrice}</p>

        <button
          onClick={handleBooking}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          disabled={selectedSeats.length === 0}
        >
          Confirm Booking
        </button>
      </div>
    </div>
  );
};

export default Seating;
