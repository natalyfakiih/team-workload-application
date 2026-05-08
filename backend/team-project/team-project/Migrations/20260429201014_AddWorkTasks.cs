using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace team_project.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkTasks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChangeRequests_Tasks_WorkTaskId",
                table: "ChangeRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_TaskAcknowledgements_Tasks_WorkTaskId",
                table: "TaskAcknowledgements");

            migrationBuilder.DropForeignKey(
                name: "FK_Tasks_AspNetUsers_AssignedToId",
                table: "Tasks");

            migrationBuilder.DropForeignKey(
                name: "FK_TaskStatusHistories_Tasks_WorkTaskId",
                table: "TaskStatusHistories");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Tasks",
                table: "Tasks");

            migrationBuilder.RenameTable(
                name: "Tasks",
                newName: "WorkTasks");

            migrationBuilder.RenameIndex(
                name: "IX_Tasks_AssignedToId",
                table: "WorkTasks",
                newName: "IX_WorkTasks_AssignedToId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_WorkTasks",
                table: "WorkTasks",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_TaskStatusHistories_ChangedById",
                table: "TaskStatusHistories",
                column: "ChangedById");

            migrationBuilder.AddForeignKey(
                name: "FK_ChangeRequests_WorkTasks_WorkTaskId",
                table: "ChangeRequests",
                column: "WorkTaskId",
                principalTable: "WorkTasks",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TaskAcknowledgements_WorkTasks_WorkTaskId",
                table: "TaskAcknowledgements",
                column: "WorkTaskId",
                principalTable: "WorkTasks",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TaskStatusHistories_AspNetUsers_ChangedById",
                table: "TaskStatusHistories",
                column: "ChangedById",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TaskStatusHistories_WorkTasks_WorkTaskId",
                table: "TaskStatusHistories",
                column: "WorkTaskId",
                principalTable: "WorkTasks",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkTasks_AspNetUsers_AssignedToId",
                table: "WorkTasks",
                column: "AssignedToId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChangeRequests_WorkTasks_WorkTaskId",
                table: "ChangeRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_TaskAcknowledgements_WorkTasks_WorkTaskId",
                table: "TaskAcknowledgements");

            migrationBuilder.DropForeignKey(
                name: "FK_TaskStatusHistories_AspNetUsers_ChangedById",
                table: "TaskStatusHistories");

            migrationBuilder.DropForeignKey(
                name: "FK_TaskStatusHistories_WorkTasks_WorkTaskId",
                table: "TaskStatusHistories");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkTasks_AspNetUsers_AssignedToId",
                table: "WorkTasks");

            migrationBuilder.DropIndex(
                name: "IX_TaskStatusHistories_ChangedById",
                table: "TaskStatusHistories");

            migrationBuilder.DropPrimaryKey(
                name: "PK_WorkTasks",
                table: "WorkTasks");

            migrationBuilder.RenameTable(
                name: "WorkTasks",
                newName: "Tasks");

            migrationBuilder.RenameIndex(
                name: "IX_WorkTasks_AssignedToId",
                table: "Tasks",
                newName: "IX_Tasks_AssignedToId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Tasks",
                table: "Tasks",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ChangeRequests_Tasks_WorkTaskId",
                table: "ChangeRequests",
                column: "WorkTaskId",
                principalTable: "Tasks",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TaskAcknowledgements_Tasks_WorkTaskId",
                table: "TaskAcknowledgements",
                column: "WorkTaskId",
                principalTable: "Tasks",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Tasks_AspNetUsers_AssignedToId",
                table: "Tasks",
                column: "AssignedToId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TaskStatusHistories_Tasks_WorkTaskId",
                table: "TaskStatusHistories",
                column: "WorkTaskId",
                principalTable: "Tasks",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
