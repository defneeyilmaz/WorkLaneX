using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WorkLaneX.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDocumentTypeAndMeetingNotes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_project_documents_ProjectId_UpdatedAt_CreatedAt",
                table: "project_documents");

            migrationBuilder.AddColumn<DateTime>(
                name: "MeetingHeldAt",
                table: "project_documents",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "project_documents",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "Spec");

            migrationBuilder.CreateIndex(
                name: "IX_project_documents_ProjectId_Type_UpdatedAt_CreatedAt",
                table: "project_documents",
                columns: new[] { "ProjectId", "Type", "UpdatedAt", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_project_documents_ProjectId_Type_UpdatedAt_CreatedAt",
                table: "project_documents");

            migrationBuilder.DropColumn(
                name: "MeetingHeldAt",
                table: "project_documents");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "project_documents");

            migrationBuilder.CreateIndex(
                name: "IX_project_documents_ProjectId_UpdatedAt_CreatedAt",
                table: "project_documents",
                columns: new[] { "ProjectId", "UpdatedAt", "CreatedAt" });
        }
    }
}
