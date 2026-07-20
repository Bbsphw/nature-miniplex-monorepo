using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NatureMiniPlex.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameIndex(
                name: "IX_Showtimes_MovieId",
                table: "Showtimes",
                newName: "IX_Showtime_MovieId");

            migrationBuilder.RenameIndex(
                name: "IX_Showtimes_CinemaId",
                table: "Showtimes",
                newName: "IX_Showtime_CinemaId");

            migrationBuilder.RenameIndex(
                name: "IX_Customers_PhoneNumber",
                table: "Customers",
                newName: "IX_Customer_PhoneNumber");

            migrationBuilder.RenameIndex(
                name: "IX_Bookings_CustomerId",
                table: "Bookings",
                newName: "IX_Booking_CustomerId");

            migrationBuilder.RenameIndex(
                name: "IX_BookingItems_BookingId",
                table: "BookingItems",
                newName: "IX_BookingItem_BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_Showtime_ShowDateTime",
                table: "Showtimes",
                column: "ShowDateTime");

            migrationBuilder.CreateIndex(
                name: "IX_BookingItem_ShowtimeId",
                table: "BookingItems",
                column: "ShowtimeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Showtime_ShowDateTime",
                table: "Showtimes");

            migrationBuilder.DropIndex(
                name: "IX_BookingItem_ShowtimeId",
                table: "BookingItems");

            migrationBuilder.RenameIndex(
                name: "IX_Showtime_MovieId",
                table: "Showtimes",
                newName: "IX_Showtimes_MovieId");

            migrationBuilder.RenameIndex(
                name: "IX_Showtime_CinemaId",
                table: "Showtimes",
                newName: "IX_Showtimes_CinemaId");

            migrationBuilder.RenameIndex(
                name: "IX_Customer_PhoneNumber",
                table: "Customers",
                newName: "IX_Customers_PhoneNumber");

            migrationBuilder.RenameIndex(
                name: "IX_Booking_CustomerId",
                table: "Bookings",
                newName: "IX_Bookings_CustomerId");

            migrationBuilder.RenameIndex(
                name: "IX_BookingItem_BookingId",
                table: "BookingItems",
                newName: "IX_BookingItems_BookingId");
        }
    }
}
