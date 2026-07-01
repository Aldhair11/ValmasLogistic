using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LogisticsSystem.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ExpandBranchDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BranchNumber",
                table: "Branches",
                type: "TEXT",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "BusinessHours",
                table: "Branches",
                type: "TEXT",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Country",
                table: "Branches",
                type: "TEXT",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Department",
                table: "Branches",
                type: "TEXT",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Province",
                table: "Branches",
                type: "TEXT",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "District",
                table: "Branches",
                type: "TEXT",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Branches",
                type: "INTEGER",
                nullable: false,
                defaultValue: true);

            migrationBuilder.Sql("""
                UPDATE "Branches"
                SET
                    "District" = COALESCE(NULLIF("City", ''), 'Por definir'),
                    "Province" = COALESCE(NULLIF("City", ''), 'Por definir'),
                    "Department" = 'Por definir',
                    "Country" = 'Perú',
                    "BusinessHours" = 'Por definir',
                    "BranchNumber" = 'SUC-' || substr(replace("Id", '-', ''), 1, 8)
                """);

            migrationBuilder.DropColumn(
                name: "City",
                table: "Branches");

            migrationBuilder.CreateIndex(
                name: "IX_Branches_BranchNumber",
                table: "Branches",
                column: "BranchNumber",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Branches_BranchNumber",
                table: "Branches");

            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "Branches",
                type: "TEXT",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql("""
                UPDATE "Branches"
                SET "City" = COALESCE(NULLIF("District", ''), 'Por definir')
                """);

            migrationBuilder.DropColumn(
                name: "BranchNumber",
                table: "Branches");

            migrationBuilder.DropColumn(
                name: "BusinessHours",
                table: "Branches");

            migrationBuilder.DropColumn(
                name: "Country",
                table: "Branches");

            migrationBuilder.DropColumn(
                name: "Department",
                table: "Branches");

            migrationBuilder.DropColumn(
                name: "Province",
                table: "Branches");

            migrationBuilder.DropColumn(
                name: "District",
                table: "Branches");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Branches");
        }
    }
}
