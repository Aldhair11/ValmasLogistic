using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LogisticsSystem.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDeliveryPin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DeliveryPin",
                table: "Shipments",
                type: "TEXT",
                maxLength: 4,
                nullable: false,
                defaultValue: "");

            // Genera PINs aleatorios de 4 dígitos para envíos preexistentes.
            // printf('%04d', ...) garantiza el padding con ceros a la izquierda.
            migrationBuilder.Sql(
                "UPDATE \"Shipments\" " +
                "SET \"DeliveryPin\" = printf('%04d', abs(random()) % 10000) " +
                "WHERE \"DeliveryPin\" = '';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeliveryPin",
                table: "Shipments");
        }
    }
}
