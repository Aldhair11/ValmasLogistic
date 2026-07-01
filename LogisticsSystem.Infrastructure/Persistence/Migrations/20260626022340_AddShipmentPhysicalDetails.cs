using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LogisticsSystem.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddShipmentPhysicalDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ContentDescription",
                table: "Shipments",
                type: "TEXT",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DeliveryType",
                table: "Shipments",
                type: "TEXT",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "DestinationBranchId",
                table: "Shipments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsFragile",
                table: "Shipments",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "PickupRequired",
                table: "Shipments",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Size",
                table: "Shipments",
                type: "TEXT",
                maxLength: 10,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "Shipments",
                type: "TEXT",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_DestinationBranchId",
                table: "Shipments",
                column: "DestinationBranchId");

            migrationBuilder.AddForeignKey(
                name: "FK_Shipments_Branches_DestinationBranchId",
                table: "Shipments",
                column: "DestinationBranchId",
                principalTable: "Branches",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Shipments_Branches_DestinationBranchId",
                table: "Shipments");

            migrationBuilder.DropIndex(
                name: "IX_Shipments_DestinationBranchId",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "ContentDescription",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "DeliveryType",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "DestinationBranchId",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "IsFragile",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "PickupRequired",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "Size",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "Shipments");
        }
    }
}
