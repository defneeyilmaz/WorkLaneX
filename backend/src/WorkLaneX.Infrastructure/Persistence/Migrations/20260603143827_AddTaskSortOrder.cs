using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WorkLaneX.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskSortOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_tasks_ProjectId_Status",
                table: "tasks");

            migrationBuilder.AddColumn<int>(
                name: "SortOrder",
                table: "tasks",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_tasks_ProjectId_Status_SortOrder",
                table: "tasks",
                columns: new[] { "ProjectId", "Status", "SortOrder" });

            migrationBuilder.Sql(
                """
                WITH ranked AS (
                    SELECT "Id",
                           (ROW_NUMBER() OVER (
                               PARTITION BY "ProjectId", "Status"
                               ORDER BY "CreatedAt")) * 1000 AS new_order
                    FROM tasks
                )
                UPDATE tasks AS t
                SET "SortOrder" = ranked.new_order
                FROM ranked
                WHERE t."Id" = ranked."Id";
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_tasks_ProjectId_Status_SortOrder",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "SortOrder",
                table: "tasks");

            migrationBuilder.CreateIndex(
                name: "IX_tasks_ProjectId_Status",
                table: "tasks",
                columns: new[] { "ProjectId", "Status" });
        }
    }
}
