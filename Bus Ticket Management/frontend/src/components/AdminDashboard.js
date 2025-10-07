import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import API_URL from "../api";

function AdminDashboard() {
  const navigate = useNavigate();

  const [buses, setBuses] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    from: "",
    to: "",
    acType: "AC",
    seatType: "Sleeper",
    seats: 30,
    price: "",
    startDate: "",
    endDate: "",
    time: ""  // new field
  });
  const [editData, setEditData] = useState(null);

  const [showSeatsForBus, setShowSeatsForBus] = useState(null);
  const [adminSelectedDate, setAdminSelectedDate] = useState("");
  const [adminSelectedSeats, setAdminSelectedSeats] = useState([]);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token || role !== "admin") navigate("/login");
  }, [navigate]);

  useEffect(() => {
    fetchBuses();
  }, []);

  const fetchBuses = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/buses`);
      setBuses(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async () => {
    try {
      const seats = formData.seatType === "Seater" ? 40 : 30;
      await axios.post(`${API_URL}/api/buses`, { ...formData, seats });
      fetchBuses();
      setFormData({
        name: "",
        from: "",
        to: "",
        acType: "AC",
        seatType: "Sleeper",
        seats: 30,
        price: "",
        startDate: "",
        endDate: "",
        time: ""
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditSave = async () => {
    try {
      const seats = editData.seatType === "Seater" ? 40 : 30;
      await axios.put(`${API_URL}/api/buses/${editData._id}`, { ...editData, seats });
      setEditData(null);
      fetchBuses();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (busId) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await axios.delete(`${API_URL}/api/buses/${busId}`);
      fetchBuses();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const getBookedSeatsForDate = (bus, dateStr) => {
    if (!bus) return [];
    const bs = bus.bookedSeats;
    if (!bs) return [];
    if (typeof bs.get === "function") return bs.get(dateStr) || [];
    return bs[dateStr] || [];
  };

  const adminHandleSeatClick = (seat, bus) => {
    const booked = getBookedSeatsForDate(bus, adminSelectedDate || today).includes(seat);
    if (booked) return;
    if (adminSelectedSeats.includes(seat))
      setAdminSelectedSeats(adminSelectedSeats.filter(s => s !== seat));
    else setAdminSelectedSeats([...adminSelectedSeats, seat]);
  };

  const adminConfirmBooking = async (bus) => {
    if (!adminSelectedDate) {
      alert("Please pick a travel date first.");
      return;
    }
    if (!adminSelectedSeats.length) {
      alert("Select seats to book.");
      return;
    }
    try {
      await axios.post(`${API_URL}/api/buses/${bus._id}/book`, {
        seatsToBook: adminSelectedSeats,
        date: adminSelectedDate
      });
      alert("Seats booked successfully.");
      setAdminSelectedSeats([]);
      fetchBuses();
    } catch (err) {
      alert(err.response?.data?.message || "Error booking seats");
    }
  };

  const renderAdminSeats = (bus) => {
    if (!bus) return null;
    const bookingDate = adminSelectedDate || today;
    const bookedSeats = getBookedSeatsForDate(bus, bookingDate);

    // For Seater
    if (bus.seatType === "Seater") {
      const seats = Array.from({ length: bus.seats }, (_, i) => ({
        number: `S${i + 1}`,
        booked: bookedSeats.includes(`S${i + 1}`)
      }));
      return (
        <div>
          <h5>Seater Layout</h5>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 60px)",
              gap: "10px",
              justifyContent: "center"
            }}
          >
            {seats.map(seat => (
              <div
                key={seat.number}
                onClick={() => adminHandleSeatClick(seat.number, bus)}
                style={{
                  width: "60px",
                  height: "60px",
                  lineHeight: "60px",
                  backgroundColor: seat.booked
                    ? "red"
                    : adminSelectedSeats.includes(seat.number)
                    ? "yellow"
                    : "#007bff",
                  color: "white",
                  borderRadius: "5px",
                  textAlign: "center",
                  cursor: seat.booked ? "not-allowed" : "pointer"
                }}
              >
                {seat.number}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // For Sleeper
    const upperSeats = Array.from({ length: 10 }, (_, i) => ({
      number: `U${i + 1}`,
      booked: bookedSeats.includes(`U${i + 1}`)
    }));
    const lowerSeats = Array.from({ length: 10 }, (_, i) => ({
      number: `L${i + 1}`,
      booked: bookedSeats.includes(`L${i + 1}`)
    }));

    const Seat = ({ seat }) => (
      <div
        onClick={() => adminHandleSeatClick(seat.number, bus)}
        style={{
          width: "80px",
          height: "40px",
          lineHeight: "40px",
          backgroundColor: seat.booked
            ? "red"
            : adminSelectedSeats.includes(seat.number)
            ? "yellow"
            : "#28a745",
          color: "white",
          borderRadius: "5px",
          textAlign: "center",
          cursor: seat.booked ? "not-allowed" : "pointer"
        }}
      >
        {seat.number}
      </div>
    );

    return (
      <div>
        <h5>Upper Deck</h5>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 90px)",
            gap: "10px",
            marginBottom: "20px"
          }}
        >
          {upperSeats.map(s => <Seat key={s.number} seat={s} />)}
        </div>
        <h5>Lower Deck</h5>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 90px)",
            gap: "10px"
          }}
        >
          {lowerSeats.map(s => <Seat key={s.number} seat={s} />)}
        </div>
      </div>
    );
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-primary">Admin Dashboard</h2>
        <button className="btn btn-warning" onClick={handleLogout}>Logout</button>
      </div>

      {/* Create/Edit Form */}
      <div className="card p-3 mb-4 border-success shadow-sm">
        <h5>{editData ? "Edit Bus" : "Create New Bus"}</h5>
        <div className="row">
          {["name", "from", "to", "price"].map(f => (
            <div className="col-md-3 mb-2" key={f}>
              <input
                type="text"
                className="form-control"
                placeholder={f}
                value={editData ? editData[f] : formData[f]}
                onChange={e => editData
                  ? setEditData({ ...editData, [f]: e.target.value })
                  : setFormData({ ...formData, [f]: e.target.value })
                }
              />
            </div>
          ))}
          <div className="col-md-3 mb-2">
            <input
              type="date"
              min={today}
              className="form-control"
              value={editData ? editData.startDate?.split("T")[0] : formData.startDate}
              onChange={e => editData
                ? setEditData({ ...editData, startDate: e.target.value })
                : setFormData({ ...formData, startDate: e.target.value })
              }
            />
          </div>
          <div className="col-md-3 mb-2">
            <input
              type="date"
              min={editData?.startDate || formData.startDate || today}
              className="form-control"
              value={editData ? editData.endDate?.split("T")[0] : formData.endDate}
              onChange={e => editData
                ? setEditData({ ...editData, endDate: e.target.value })
                : setFormData({ ...formData, endDate: e.target.value })
              }
            />
          </div>
          <div className="col-md-3 mb-2">
            <select
              className="form-control"
              value={editData ? editData.acType : formData.acType}
              onChange={e => editData
                ? setEditData({ ...editData, acType: e.target.value })
                : setFormData({ ...formData, acType: e.target.value })
              }
            >
              <option value="AC">AC</option>
              <option value="NON-AC">NON-AC</option>
            </select>
          </div>
          <div className="col-md-3 mb-2">
            <select
              className="form-control"
              value={editData ? editData.seatType : formData.seatType}
              onChange={e => {
                const seats = e.target.value === "Seater" ? 40 : 30;
                editData
                  ? setEditData({ ...editData, seatType: e.target.value, seats })
                  : setFormData({ ...formData, seatType: e.target.value, seats });
              }}
            >
              <option value="Seater">Seater</option>
              <option value="Sleeper">Sleeper</option>
            </select>
          </div>
          <div className="col-md-3 mb-2">
            <input
              type="time"
              className="form-control"
              value={editData ? editData.time : formData.time}
              onChange={e => editData
                ? setEditData({ ...editData, time: e.target.value })
                : setFormData({ ...formData, time: e.target.value })
              }
            />
            {/* using <input type="time"> for time input */}
          </div>
        </div>
        <button
          className="btn btn-success mt-2"
          onClick={editData ? handleEditSave : handleCreate}
        >
          {editData ? "Save Changes" : "Add Bus"}
        </button>
      </div>

      {/* Buses Table */}
      <table className="table table-bordered table-hover shadow-sm">
        <thead className="table-dark">
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Seat Type</th>
            <th>Route</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Price</th>
            <th>Time</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {buses.filter(b => new Date(b.endDate) >= new Date()).map(bus => (
            <tr key={bus._id}>
              <td>{bus.name}</td>
              <td>{bus.acType}</td>
              <td>{bus.seatType}</td>
              <td>{bus.from} → {bus.to}</td>
              <td>{new Date(bus.startDate).toLocaleDateString()}</td>
              <td>{new Date(bus.endDate).toLocaleDateString()}</td>
              <td>₹{bus.price}</td>
              <td>{bus.time}</td>
              <td>
                <button className="btn btn-sm btn-info me-2" onClick={() => {
                  setShowSeatsForBus(showSeatsForBus === bus._id ? null : bus._id);
                  setAdminSelectedDate("");
                  setAdminSelectedSeats([]);
                }}>View Seats</button>
                <button className="btn btn-sm btn-warning me-2" onClick={() => setEditData(bus)}>Edit</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(bus._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showSeatsForBus && (
        <div className="card p-3 mt-3 border-primary shadow-sm">
          <h4 className="text-primary">Seat Layout (Admin view)</h4>
          <div className="mb-2 d-flex align-items-center gap-2">
            <label style={{ minWidth: 120 }}>Select Travel Date:</label>
            <input
              type="date"
              className="form-control"
              value={adminSelectedDate}
              min={today}
              onChange={e => {
                setAdminSelectedDate(e.target.value);
                setAdminSelectedSeats([]);
              }}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            {renderAdminSeats(buses.find(b => b._id === showSeatsForBus))}
          </div>

          <div className="mt-3">
            <button className="btn btn-success" onClick={() => adminConfirmBooking(buses.find(b => b._id === showSeatsForBus))}>
              Book Selected Seats (as Admin)
            </button>
            <button className="btn btn-secondary ms-2" onClick={() => setAdminSelectedSeats([])}>
              Clear Selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
