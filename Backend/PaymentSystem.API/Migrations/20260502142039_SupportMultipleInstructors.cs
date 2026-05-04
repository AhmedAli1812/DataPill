using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PaymentSystem.API.Migrations
{
    /// <inheritdoc />
    public partial class SupportMultipleInstructors : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CourseGroups_AspNetUsers_InstructorId",
                table: "CourseGroups");

            migrationBuilder.DropIndex(
                name: "IX_CourseGroups_InstructorId",
                table: "CourseGroups");

            migrationBuilder.DropColumn(
                name: "InstructorId",
                table: "CourseGroups");

            migrationBuilder.CreateTable(
                name: "CourseGroupInstructors",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CourseGroupId = table.Column<int>(type: "int", nullable: false),
                    InstructorId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CourseGroupInstructors", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CourseGroupInstructors_AspNetUsers_InstructorId",
                        column: x => x.InstructorId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CourseGroupInstructors_CourseGroups_CourseGroupId",
                        column: x => x.CourseGroupId,
                        principalTable: "CourseGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CourseGroupInstructors_CourseGroupId",
                table: "CourseGroupInstructors",
                column: "CourseGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_CourseGroupInstructors_InstructorId",
                table: "CourseGroupInstructors",
                column: "InstructorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CourseGroupInstructors");

            migrationBuilder.AddColumn<string>(
                name: "InstructorId",
                table: "CourseGroups",
                type: "nvarchar(450)",
                maxLength: 450,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CourseGroups_InstructorId",
                table: "CourseGroups",
                column: "InstructorId");

            migrationBuilder.AddForeignKey(
                name: "FK_CourseGroups_AspNetUsers_InstructorId",
                table: "CourseGroups",
                column: "InstructorId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }
    }
}
