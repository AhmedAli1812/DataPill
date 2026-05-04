using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PaymentSystem.API.Migrations
{
    /// <inheritdoc />
    public partial class AddInstructorFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RecipientId",
                table: "Salaries",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InstructorId",
                table: "CourseGroups",
                type: "nvarchar(450)",
                maxLength: 450,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Schedule",
                table: "CourseGroups",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "HourlyRate",
                table: "AspNetUsers",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "InstructorSessions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    InstructorId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    CourseGroupId = table.Column<int>(type: "int", nullable: false),
                    SessionDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    HoursWorked = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    HourlyRateAtTime = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    IsPaid = table.Column<bool>(type: "bit", nullable: false),
                    SalaryId = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedById = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InstructorSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InstructorSessions_AspNetUsers_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_InstructorSessions_AspNetUsers_InstructorId",
                        column: x => x.InstructorId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_InstructorSessions_CourseGroups_CourseGroupId",
                        column: x => x.CourseGroupId,
                        principalTable: "CourseGroups",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_InstructorSessions_Salaries_SalaryId",
                        column: x => x.SalaryId,
                        principalTable: "Salaries",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Salaries_RecipientId",
                table: "Salaries",
                column: "RecipientId");

            migrationBuilder.CreateIndex(
                name: "IX_CourseGroups_InstructorId",
                table: "CourseGroups",
                column: "InstructorId");

            migrationBuilder.CreateIndex(
                name: "IX_InstructorSessions_CourseGroupId",
                table: "InstructorSessions",
                column: "CourseGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_InstructorSessions_CreatedById",
                table: "InstructorSessions",
                column: "CreatedById");

            migrationBuilder.CreateIndex(
                name: "IX_InstructorSessions_InstructorId",
                table: "InstructorSessions",
                column: "InstructorId");

            migrationBuilder.CreateIndex(
                name: "IX_InstructorSessions_SalaryId",
                table: "InstructorSessions",
                column: "SalaryId");

            migrationBuilder.AddForeignKey(
                name: "FK_CourseGroups_AspNetUsers_InstructorId",
                table: "CourseGroups",
                column: "InstructorId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Salaries_AspNetUsers_RecipientId",
                table: "Salaries",
                column: "RecipientId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CourseGroups_AspNetUsers_InstructorId",
                table: "CourseGroups");

            migrationBuilder.DropForeignKey(
                name: "FK_Salaries_AspNetUsers_RecipientId",
                table: "Salaries");

            migrationBuilder.DropTable(
                name: "InstructorSessions");

            migrationBuilder.DropIndex(
                name: "IX_Salaries_RecipientId",
                table: "Salaries");

            migrationBuilder.DropIndex(
                name: "IX_CourseGroups_InstructorId",
                table: "CourseGroups");

            migrationBuilder.DropColumn(
                name: "RecipientId",
                table: "Salaries");

            migrationBuilder.DropColumn(
                name: "InstructorId",
                table: "CourseGroups");

            migrationBuilder.DropColumn(
                name: "Schedule",
                table: "CourseGroups");

            migrationBuilder.DropColumn(
                name: "HourlyRate",
                table: "AspNetUsers");
        }
    }
}
