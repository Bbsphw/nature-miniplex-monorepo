"use client";

import { useState, useEffect } from "react";
import axios from "axios";

// Types
type Cinema = { id: number; name: string };
type Movie = { id: number; title: string; isActive: boolean };
type Showtime = { id: number; showDateTime: string; ticketPrice: number };
type SeatStatus = { seatId: number; seatName: string; rowName: string; columnName: string; isBooked: boolean; bookedByPhoneNumber: string | null };

const API_BASE = "https://localhost:7157/api"; // Default ASP.NET Core dev port

export default function Home() {
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedCinemaId, setSelectedCinemaId] = useState<number>(0);
  const [selectedMovieId, setSelectedMovieId] = useState<number>(0);
  
  // Hardcoded showtime ID for MVP since we haven't built the Showtime UI to fetch them yet
  // We'll mock selecting a showtime after selecting a movie for simplicity, 
  // but ideally we fetch showtimes based on Cinema & Movie.
  const [showtimeId, setShowtimeId] = useState<number>(0); 
  const [seats, setSeats] = useState<SeatStatus[]>([]);
  
  const [phone, setPhone] = useState("");
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  
  useEffect(() => {
    // Fetch Cinemas
    axios.get(`${API_BASE}/Cinemas`).then(res => {
      setCinemas(res.data);
      if (res.data.length > 0) setSelectedCinemaId(res.data[0].id);
    }).catch(console.error);

    // Fetch Movies
    axios.get(`${API_BASE}/Movies`).then(res => {
      setMovies(res.data);
      if (res.data.length > 0) setSelectedMovieId(res.data[0].id);
    }).catch(console.error);
  }, []);

  // Fetch Seats when a showtime is selected
  useEffect(() => {
    if (showtimeId > 0) {
      fetchSeats();
    }
  }, [showtimeId]);

  const fetchSeats = () => {
    axios.get(`${API_BASE}/Cinemas/showtimes/${showtimeId}/seats`).then(res => {
      setSeats(res.data);
    }).catch(console.error);
  };

  const handleSeatClick = (seat: SeatStatus) => {
    if (seat.isBooked) {
      // Prompt to cancel
      const enteredPhone = prompt(`Seat ${seat.seatName} is booked. Enter phone number to cancel:`);
      if (enteredPhone) {
        // We need BookingId to cancel, but we don't return it in SeatStatusDto.
        // For MVP, we might need backend to support cancelling by Phone + SeatId.
        alert("Cancellation requires BookingId in the current backend design. Please implement in backend.");
      }
      return;
    }

    // Toggle selection
    if (selectedSeats.includes(seat.seatId)) {
      setSelectedSeats(selectedSeats.filter(id => id !== seat.seatId));
    } else {
      if (selectedSeats.length >= 4) {
        alert("Maximum 4 seats can be selected");
        return;
      }
      setSelectedSeats([...selectedSeats, seat.seatId]);
    }
  };

  const bookTickets = async () => {
    if (!phone || selectedSeats.length === 0) {
      alert("Please enter phone number and select seats.");
      return;
    }

    try {
      await axios.post(`${API_BASE}/Bookings`, {
        showtimeId,
        phoneNumber: phone,
        seatIds: selectedSeats
      });
      alert("Booking successful!");
      setSelectedSeats([]);
      fetchSeats();
    } catch (err: any) {
      alert(err.response?.data?.error || "Error booking tickets");
    }
  };

  return (
    <main className="min-h-screen bg-[#0f172a] text-white p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-5xl mx-auto space-y-12">
        <header className="text-center space-y-4">
          <h1 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
            Nature MiniPlex
          </h1>
          <p className="text-slate-400 text-lg">Premium Cinema Ticket Booking Prototype</p>
        </header>

        <section className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50 shadow-2xl flex flex-wrap gap-6 items-end justify-between">
          <div className="space-y-2 flex-1 min-w-[200px]">
            <label className="text-sm font-medium text-slate-300">== เลือกโรงหนัง ==</label>
            <select 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 outline-none focus:border-indigo-500 transition-colors"
              value={selectedCinemaId} onChange={e => setSelectedCinemaId(Number(e.target.value))}
            >
              <option value="0">Select Cinema</option>
              {cinemas.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          
          <div className="space-y-2 flex-1 min-w-[200px]">
            <label className="text-sm font-medium text-slate-300">== เลือกเรื่องหนัง ==</label>
            <select 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 outline-none focus:border-indigo-500 transition-colors"
              value={selectedMovieId} onChange={e => setSelectedMovieId(Number(e.target.value))}
            >
              <option value="0">Select Movie</option>
              {movies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </div>

          <div className="space-y-2 flex-1 min-w-[200px]">
             <label className="text-sm font-medium text-slate-300">Showtime ID (Mock for MVP)</label>
             <input 
               type="number" 
               placeholder="e.g. 1" 
               className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 outline-none focus:border-indigo-500"
               value={showtimeId || ''} 
               onChange={e => setShowtimeId(Number(e.target.value))} 
             />
          </div>
        </section>

        {showtimeId > 0 && (
          <section className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-8 border border-slate-700/50 shadow-2xl">
            <h2 className="text-2xl font-semibold mb-6">ที่นั่งสำหรับจองและยกเลิกการจอง</h2>
            <div className="flex gap-4 mb-8 text-sm text-slate-400">
              <div className="flex items-center gap-2"><div className="w-4 h-4 bg-white rounded"></div> ว่าง</div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 bg-slate-500 rounded"></div> จองแล้ว</div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 bg-indigo-500 rounded ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-800"></div> กำลังเลือก</div>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {seats.map(seat => (
                <button
                  key={seat.seatId}
                  onClick={() => handleSeatClick(seat)}
                  className={`
                    relative p-4 rounded-xl flex flex-col items-center justify-center min-h-[80px] transition-all duration-300
                    ${seat.isBooked 
                      ? 'bg-slate-600 cursor-not-allowed text-slate-300' 
                      : selectedSeats.includes(seat.seatId)
                        ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] scale-105'
                        : 'bg-white text-slate-900 hover:bg-slate-200 cursor-pointer hover:scale-105'
                    }
                  `}
                >
                  <span className="text-xl font-bold">{seat.seatName}</span>
                  {seat.isBooked && seat.bookedByPhoneNumber && (
                    <span className="text-[10px] opacity-80 mt-1">{seat.bookedByPhoneNumber}</span>
                  )}
                </button>
              ))}
            </div>

            {selectedSeats.length > 0 && (
              <div className="mt-12 bg-slate-900/50 rounded-xl p-6 border border-indigo-500/30 flex flex-wrap gap-4 items-center">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-300 mb-2">เบอร์โทรศัพท์สำหรับจอง (9-10 หลัก)</label>
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)}
                    placeholder="0899999999"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="flex-none self-end">
                  <button 
                    onClick={bookTickets}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 px-8 rounded-lg shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
                  >
                    ยืนยันการจอง {selectedSeats.length} ที่นั่ง
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
