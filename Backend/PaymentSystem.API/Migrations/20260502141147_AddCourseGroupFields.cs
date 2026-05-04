using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PaymentSystem.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCourseGroupFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Day1",
                table: "CourseGroups",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Day1Time",
                table: "CourseGroups",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Day2",
                table: "CourseGroups",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Day2Time",
                table: "CourseGroups",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GroupCode",
                table: "CourseGroups",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TotalHours",
                table: "CourseGroups",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Day1",
                table: "CourseGroups");

            migrationBuilder.DropColumn(
                name: "Day1Time",
                table: "CourseGroups");

            migrationBuilder.DropColumn(
                name: "Day2",
                table: "CourseGroups");

            migrationBuilder.DropColumn(
                name: "Day2Time",
                table: "CourseGroups");

            migrationBuilder.DropColumn(
                name: "GroupCode",
                table: "CourseGroups");

            migrationBuilder.DropColumn(
                name: "TotalHours",
                table: "CourseGroups");
        }
    }
}
