using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PaymentSystem.API.Migrations
{
    /// <inheritdoc />
    public partial class AddGroupsAndUnifiedRegistration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CourseGroupId",
                table: "CourseSubscriptions",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CourseGroups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    WaveName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Capacity = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedById = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CourseGroups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CourseGroups_AspNetUsers_CreatedById",
                        column: x => x.CreatedById,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CourseSubscriptions_CourseGroupId",
                table: "CourseSubscriptions",
                column: "CourseGroupId");

            migrationBuilder.CreateIndex(
                name: "IX_CourseGroups_CreatedById",
                table: "CourseGroups",
                column: "CreatedById");

            migrationBuilder.AddForeignKey(
                name: "FK_CourseSubscriptions_CourseGroups_CourseGroupId",
                table: "CourseSubscriptions",
                column: "CourseGroupId",
                principalTable: "CourseGroups",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CourseSubscriptions_CourseGroups_CourseGroupId",
                table: "CourseSubscriptions");

            migrationBuilder.DropTable(
                name: "CourseGroups");

            migrationBuilder.DropIndex(
                name: "IX_CourseSubscriptions_CourseGroupId",
                table: "CourseSubscriptions");

            migrationBuilder.DropColumn(
                name: "CourseGroupId",
                table: "CourseSubscriptions");
        }
    }
}
