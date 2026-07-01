using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LogisticsSystem.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Shipments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Origin_Street = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Origin_City = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Origin_State = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Origin_ZipCode = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Destination_Street = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Destination_City = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Destination_State = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Destination_ZipCode = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    WeightInKg = table.Column<decimal>(type: "TEXT", nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    TrackingNumber = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Shipments", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_TrackingNumber",
                table: "Shipments",
                column: "TrackingNumber",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Shipments");
        }
    }
}
