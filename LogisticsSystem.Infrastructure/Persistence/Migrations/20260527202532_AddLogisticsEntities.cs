using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LogisticsSystem.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddLogisticsEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AssignedCourierId",
                table: "Shipments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CurrentBranchId",
                table: "Shipments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "RecipientId",
                table: "Shipments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SenderId",
                table: "Shipments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Branches",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    Address = table.Column<string>(type: "TEXT", maxLength: 300, nullable: false),
                    City = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Branches", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Customers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Dni = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    FullName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Email = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Phone = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Customers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Vehicles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    LicensePlate = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Model = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    CapacityInKg = table.Column<decimal>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Vehicles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Couriers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    FullName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Phone = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false),
                    IsAvailable = table.Column<bool>(type: "INTEGER", nullable: false),
                    CurrentVehicleId = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Couriers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Couriers_Vehicles_CurrentVehicleId",
                        column: x => x.CurrentVehicleId,
                        principalTable: "Vehicles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_AssignedCourierId",
                table: "Shipments",
                column: "AssignedCourierId");

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_CurrentBranchId",
                table: "Shipments",
                column: "CurrentBranchId");

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_RecipientId",
                table: "Shipments",
                column: "RecipientId");

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_SenderId",
                table: "Shipments",
                column: "SenderId");

            migrationBuilder.CreateIndex(
                name: "IX_Couriers_CurrentVehicleId",
                table: "Couriers",
                column: "CurrentVehicleId");

            migrationBuilder.CreateIndex(
                name: "IX_Customers_Dni",
                table: "Customers",
                column: "Dni",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Vehicles_LicensePlate",
                table: "Vehicles",
                column: "LicensePlate",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Shipments_Branches_CurrentBranchId",
                table: "Shipments",
                column: "CurrentBranchId",
                principalTable: "Branches",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Shipments_Couriers_AssignedCourierId",
                table: "Shipments",
                column: "AssignedCourierId",
                principalTable: "Couriers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Shipments_Customers_RecipientId",
                table: "Shipments",
                column: "RecipientId",
                principalTable: "Customers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Shipments_Customers_SenderId",
                table: "Shipments",
                column: "SenderId",
                principalTable: "Customers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Shipments_Branches_CurrentBranchId",
                table: "Shipments");

            migrationBuilder.DropForeignKey(
                name: "FK_Shipments_Couriers_AssignedCourierId",
                table: "Shipments");

            migrationBuilder.DropForeignKey(
                name: "FK_Shipments_Customers_RecipientId",
                table: "Shipments");

            migrationBuilder.DropForeignKey(
                name: "FK_Shipments_Customers_SenderId",
                table: "Shipments");

            migrationBuilder.DropTable(
                name: "Branches");

            migrationBuilder.DropTable(
                name: "Couriers");

            migrationBuilder.DropTable(
                name: "Customers");

            migrationBuilder.DropTable(
                name: "Vehicles");

            migrationBuilder.DropIndex(
                name: "IX_Shipments_AssignedCourierId",
                table: "Shipments");

            migrationBuilder.DropIndex(
                name: "IX_Shipments_CurrentBranchId",
                table: "Shipments");

            migrationBuilder.DropIndex(
                name: "IX_Shipments_RecipientId",
                table: "Shipments");

            migrationBuilder.DropIndex(
                name: "IX_Shipments_SenderId",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "AssignedCourierId",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "CurrentBranchId",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "RecipientId",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "SenderId",
                table: "Shipments");
        }
    }
}
