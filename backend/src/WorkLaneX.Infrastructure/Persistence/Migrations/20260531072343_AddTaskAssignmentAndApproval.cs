using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WorkLaneX.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskAssignmentAndApproval : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ApprovalStatus",
                table: "tasks",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "ApprovedAt",
                table: "tasks",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ApprovedById",
                table: "tasks",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AssigneeId",
                table: "tasks",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CompletionNote",
                table: "tasks",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RejectionNote",
                table: "tasks",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_tasks_AssigneeId",
                table: "tasks",
                column: "AssigneeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_tasks_AssigneeId",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "ApprovalStatus",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "ApprovedAt",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "ApprovedById",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "AssigneeId",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "CompletionNote",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "RejectionNote",
                table: "tasks");
        }
    }
}
