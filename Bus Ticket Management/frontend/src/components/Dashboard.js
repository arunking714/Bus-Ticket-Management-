import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
// You’ll need a PDF library like jspdf
import jsPDF from "jspdf";
import API_URL from "../api";

function UserDashboard() {
  const [buses, setBuses] = useState([]);
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [filters, setFilters] = useState({ from: "", to: "", date: "", acType: "", seatType: "" });
  const [ticket, setTicket] = useState(null);
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token) navigate("/login");
    else if (role !== "user") navigate(role === "admin" ? "/admin-dashboard" : "/login");
  }, [navigate]);

  useEffect(() => {
    fetchBuses();
  }, []);

  const fetchBuses = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/buses`);
      const activeBuses = res.data.filter(b => new Date(b.endDate) >= new Date());
      setBuses(activeBuses);
      setFilteredBuses(activeBuses);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const isDateWithinBusRange = (bus, dateStr) => {
    if (!dateStr) return true;
    const date = new Date(dateStr);
    const st = new Date(bus.startDate);
    const en = new Date(bus.endDate);
    st.setHours(0,0,0,0);
    en.setHours(23,59,59,999);
    return date >= st && date <= en;
  };

  const applyFilters = () => {
    let temp = [...buses];
    if (filters.from) temp = temp.filter(b => b.from.toLowerCase() === filters.from.toLowerCase());
    if (filters.to) temp = temp.filter(b => b.to.toLowerCase() === filters.to.toLowerCase());
    if (filters.date) temp = temp.filter(b => isDateWithinBusRange(b, filters.date));
    if (filters.acType) temp = temp.filter(b => b.acType.toLowerCase() === filters.acType.toLowerCase());
    if (filters.seatType) temp = temp.filter(b => b.seatType.toLowerCase() === filters.seatType.toLowerCase());
    setFilteredBuses(temp);
  };

  const getBookedSeatsForDate = (bus, dateStr) => {
    if (!bus) return [];
    const bs = bus.bookedSeats;
    if (!bs) return [];
    if (typeof bs.get === "function") return bs.get(dateStr) || [];
    return bs[dateStr] || [];
  };

  const handleSeatClick = (seat) => {
    if (seat.booked) return;
    if (selectedSeats.includes(seat.number))
      setSelectedSeats(selectedSeats.filter(s => s !== seat.number));
    else setSelectedSeats([...selectedSeats, seat.number]);
  };

  const confirmBooking = async () => {
    if (!selectedSeats.length) {
      alert("Select at least one seat!");
      return;
    }
    try {
      const dateToBook = filters.date || today;
      const res = await axios.post(`${API_URL}/api/buses/${selectedBus._id}/book`, {
        seatsToBook: selectedSeats,
        date: dateToBook
      });
      alert("Booking successful!");
      const updatedBooked = res.data.bookedSeats || [];

      let newBookedSeats = { ...(selectedBus.bookedSeats || {}) };
      if (typeof (selectedBus.bookedSeats?.get) === "function") {
        selectedBus.bookedSeats.set(dateToBook, updatedBooked);
      } else {
        newBookedSeats[dateToBook] = updatedBooked;
        setSelectedBus({ ...selectedBus, bookedSeats: newBookedSeats });
      }

      // Generate ticket object
      const ticketObj = {
        travels: selectedBus.name,
        from: selectedBus.from,
        to: selectedBus.to,
        seats: selectedSeats,
        date: dateToBook,
        time: selectedBus.time,
        totalPrice: selectedSeats.length * selectedBus.price
      };
      setTicket(ticketObj);

      setSelectedSeats([]);
      fetchBuses();
    } catch (err) {
      alert(err.response?.data?.message || "Booking error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const renderSeats = (bus) => {
    if (!bus) return null;
    const bookingDate = filters.date || today;
    const bookedSeats = getBookedSeatsForDate(bus, bookingDate);

    if (bus.seatType === "Seater") {
      const seats = Array.from({ length: bus.seats }, (_, i) => ({
        number: `S${i + 1}`, booked: bookedSeats.includes(`S${i + 1}`)
      }));
      return (
        <div>
          <h5>Seater Layout</h5>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 60px)",
            gap: "10px",
            justifyContent: "center"
          }}>
            {seats.map(seat => (
              <div
                key={seat.number}
                onClick={() => handleSeatClick(seat)}
                style={{
                  width: "60px",
                  height: "60px",
                  lineHeight: "60px",
                  backgroundColor: seat.booked
                    ? "red"
                    : selectedSeats.includes(seat.number)
                    ? "yellow"
                    : "#007bff",
                  color: "white",
                  borderRadius: "5px",
                  textAlign: "center",
                  cursor: seat.booked ? "not-allowed" : "pointer"
                }}
              >{seat.number}</div>
            ))}
          </div>
        </div>
      );
    }

    const upperSeats = Array.from({ length: 10 }, (_, i) => ({
      number: `U${i + 1}`, booked: bookedSeats.includes(`U${i + 1}`)
    }));
    const lowerSeats = Array.from({ length: 10 }, (_, i) => ({
      number: `L${i + 1}`, booked: bookedSeats.includes(`L${i + 1}`)
    }));

    const Seat = ({ seat }) => (
      <div
        onClick={() => handleSeatClick(seat)}
        style={{
          width: "80px",
          height: "40px",
          lineHeight: "40px",
          backgroundColor: seat.booked
            ? "red"
            : selectedSeats.includes(seat.number)
            ? "yellow"
            : "#28a745",
          color: "white",
          borderRadius: "5px",
          textAlign: "center",
          cursor: seat.booked ? "not-allowed" : "pointer"
        }}
      >{seat.number}</div>
    );

    return (
      <div>
        <h5>Upper Deck</h5>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 90px)",
          gap: "10px",
          marginBottom: "20px"
        }}>{upperSeats.map(s => <Seat key={s.number} seat={s} />)}</div>
        <h5>Lower Deck</h5>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 90px)",
          gap: "10px"
        }}>{lowerSeats.map(s => <Seat key={s.number} seat={s} />)}</div>
      </div>
    );
  };

  // PDF download logic
  const downloadTicket = () => {
    if (!ticket) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Travel Ticket", 20, 20);
    doc.setFontSize(12);
    doc.text(`Travels: ${ticket.travels}`, 20, 40);
    doc.text(`From → To: ${ticket.from} → ${ticket.to}`, 20, 50);
    doc.text(`Date: ${ticket.date}`, 20, 60);
    doc.text(`Time: ${ticket.time}`, 20, 70);
    doc.text(`Seats: ${ticket.seats.join(", ")}`, 20, 80);
    doc.text(`Total Price: ₹${ticket.totalPrice}`, 20, 90);
    doc.save(`ticket_${ticket.travels}_${ticket.date}.pdf`);
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="text-primary">Available Buses</h2>
        <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
      </div>

      {/* Filters */}
      <div className="mb-3 d-flex gap-2 flex-wrap">
        <input type="text" name="from" placeholder="From" value={filters.from} onChange={handleFilterChange} className="form-control" />
        <input type="text" name="to" placeholder="To" value={filters.to} onChange={handleFilterChange} className="form-control" />
        <input type="date" name="date" value={filters.date} onChange={handleFilterChange} className="form-control" />
        <select name="acType" value={filters.acType} onChange={handleFilterChange} className="form-control">
          <option value="">AC/Non-AC</option>
          <option value="AC">AC</option>
          <option value="NON-AC">NON-AC</option>
        </select>
        <select name="seatType" value={filters.seatType} onChange={handleFilterChange} className="form-control">
          <option value="">Seat Type</option>
          <option value="Seater">Seater</option>
          <option value="Sleeper">Sleeper</option>
        </select>
        <button className="btn btn-primary" onClick={applyFilters}>Apply Filters</button>
      </div>

      <table className="table table-bordered table-hover">
        <thead className="table-dark">
          <tr>
            <th>Name</th><th>Type</th><th>Seat Type</th><th>Route</th><th>Price</th><th>Time</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredBuses.map(bus => (
            <tr key={bus._id}>
              <td>{bus.name}</td>
              <td>{bus.acType}</td>
              <td>{bus.seatType}</td>
              <td>{bus.from} → {bus.to}</td>
              <td>₹{bus.price}</td>
              <td>{bus.time}</td>
              <td>
                <button className="btn btn-primary btn-sm" onClick={() => { setSelectedBus(bus); setSelectedSeats([]); }}>View Seats</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedBus && (
        <div className="mt-4">
          <h4 className="text-success">Seat Layout for {selectedBus.name}</h4>
          {renderSeats(selectedBus)}
          <div className="mt-3">
            <h5>Selected Seats: {selectedSeats.join(", ") || "None"}</h5>
            <h5>Total Price: ₹{selectedSeats.length * selectedBus.price || 0}</h5>
            <button className="btn btn-success" onClick={confirmBooking}>Confirm Booking</button>
          </div>
        </div>
      )}

      {/* Ticket display and download */}
      {ticket && (
        <div className="card p-3 mt-4 border-info shadow-sm">
          <h4 className="text-info">Your Ticket</h4>
          <p><strong>Travels:</strong> {ticket.travels}</p>
          <p><strong>From → To:</strong> {ticket.from} → {ticket.to}</p>
          <p><strong>Date:</strong> {ticket.date}</p>
          <p><strong>Time:</strong> {ticket.time}</p>
          <p><strong>Seats:</strong> {ticket.seats.join(", ")}</p>
          <p><strong>Total Price:</strong> ₹{ticket.totalPrice}</p>
          <button className="btn btn-primary" onClick={downloadTicket}>Download Ticket (PDF)</button>
        </div>
      )}
    </div>
  );
}

export default UserDashboard;
