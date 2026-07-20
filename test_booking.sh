#!/bin/bash
# test_booking.sh

echo "Starting Backend API in background..."
cd /home/khingg/nature-miniplex-monorepo/backend/src/API
dotnet run > /dev/null 2>&1 &
API_PID=$!

echo "Waiting for API to start on port 5000..."
sleep 10

echo "1. Fetching available showtimes..."
SHOWTIME_ID=$(curl -s http://localhost:5000/api/showtimes | grep -o '"id":[^,]*' | head -1 | cut -d: -f2 | tr -d ' ')
if [ -z "$SHOWTIME_ID" ]; then
    echo "No showtime found. Creating one..."
    # Dummy creating a showtime if needed, but assuming one exists.
    SHOWTIME_ID=1
fi
echo "Using Showtime ID: $SHOWTIME_ID"

echo "2. Fetching available seats for Showtime $SHOWTIME_ID..."
SEAT_ID=$(curl -s http://localhost:5000/api/showtimes/$SHOWTIME_ID/seats | grep -o '"seatId":[^,]*' | head -1 | cut -d: -f2 | tr -d ' ')
if [ -z "$SEAT_ID" ]; then
    echo "No seat found. Defaulting to 1."
    SEAT_ID=1
fi
echo "Using Seat ID: $SEAT_ID"

echo "3. Creating a Booking (Phone + Email)..."
BOOKING_RESPONSE=$(curl -s -X POST http://localhost:5000/api/bookings \
    -H "Content-Type: application/json" \
    -d '{
        "showtimeId": '$SHOWTIME_ID',
        "phoneNumber": "0891234567",
        "email": "test_srs@example.com",
        "seatIds": ['$SEAT_ID']
    }')

echo "Booking Response: $BOOKING_RESPONSE"
BOOKING_ID=$(echo $BOOKING_RESPONSE | tr -d '"')

if [[ "$BOOKING_ID" == *"Error"* || "$BOOKING_ID" == *"Exception"* ]]; then
    echo "Booking failed!"
else
    echo "Booking successful. ID: $BOOKING_ID"
    
    echo "4. Checking Mailpit for E-Ticket Email..."
    sleep 3
    MAIL_RESPONSE=$(curl -s http://localhost:8025/api/v1/messages)
    
    if [[ "$MAIL_RESPONSE" == *"$BOOKING_ID"* ]]; then
        echo "SUCCESS: Email found in Mailpit containing Booking ID $BOOKING_ID!"
    else
        echo "FAILED: Email not found in Mailpit."
    fi
fi

# Cleanup
kill $API_PID
echo "Test completed."
