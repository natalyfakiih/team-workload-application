using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace team_project.Migrations
{
    /// <inheritdoc />
    public partial class AddReasontoChangeRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Reason",
                table: "ChangeRequests",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "RejectionNote",
                table: "ChangeRequests",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Reason",
                table: "ChangeRequests");

            migrationBuilder.DropColumn(
                name: "RejectionNote",
                table: "ChangeRequests");
        }
    }
}
