using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PaymentSystem.API.Migrations
{
    /// <inheritdoc />
    public partial class AddInstructorToStudentSession : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "InstructorId",
                table: "StudentSessions",
                type: "nvarchar(450)",
                maxLength: 450,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_StudentSessions_InstructorId",
                table: "StudentSessions",
                column: "InstructorId");

            migrationBuilder.AddForeignKey(
                name: "FK_StudentSessions_AspNetUsers_InstructorId",
                table: "StudentSessions",
                column: "InstructorId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StudentSessions_AspNetUsers_InstructorId",
                table: "StudentSessions");

            migrationBuilder.DropIndex(
                name: "IX_StudentSessions_InstructorId",
                table: "StudentSessions");

            migrationBuilder.DropColumn(
                name: "InstructorId",
                table: "StudentSessions");
        }
    }
}
