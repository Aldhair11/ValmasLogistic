using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LogisticsSystem.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RenameBranchNumberToPhone : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Branches_BranchNumber",
                table: "Branches");

            migrationBuilder.RenameColumn(
                name: "BranchNumber",
                table: "Branches",
                newName: "Phone");

            migrationBuilder.Sql("""
                UPDATE "Branches"
                SET "Phone" = 'Por definir'
                WHERE "Phone" LIKE 'SUC-%' OR trim("Phone") = ''
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Phone",
                table: "Branches",
                newName: "BranchNumber");

            migrationBuilder.CreateIndex(
                name: "IX_Branches_BranchNumber",
                table: "Branches",
                column: "BranchNumber",
                unique: true);
        }
    }
}
