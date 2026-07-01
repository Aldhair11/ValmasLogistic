using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LogisticsSystem.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentMethod : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Para los envíos preexistentes asumimos PrePaid: es el método
            // por defecto antes de que existiera la opción "contra entrega".
            // Necesitamos un default no vacío porque PaymentMethod se persiste
            // como string del enum y "" no mapea a ningún valor válido.
            migrationBuilder.AddColumn<string>(
                name: "PaymentMethod",
                table: "Shipments",
                type: "TEXT",
                maxLength: 20,
                nullable: false,
                defaultValue: "PrePaid");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PaymentMethod",
                table: "Shipments");
        }
    }
}
