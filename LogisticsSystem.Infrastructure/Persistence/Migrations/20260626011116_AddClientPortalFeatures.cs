using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LogisticsSystem.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddClientPortalFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "CustomerProfileId",
                table: "Users",
                type: "TEXT",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"),
                column: "CustomerProfileId",
                value: null);

            migrationBuilder.CreateIndex(
                name: "IX_Users_CustomerProfileId",
                table: "Users",
                column: "CustomerProfileId");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Customers_CustomerProfileId",
                table: "Users",
                column: "CustomerProfileId",
                principalTable: "Customers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_Customers_CustomerProfileId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_CustomerProfileId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CustomerProfileId",
                table: "Users");
        }
    }
}
