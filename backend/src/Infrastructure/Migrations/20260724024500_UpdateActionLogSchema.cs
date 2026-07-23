using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NatureMiniPlex.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateActionLogSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop old columns if they exist
            migrationBuilder.DropColumn(
                name: "ActionType",
                table: "ActionLogs");

            migrationBuilder.DropColumn(
                name: "EntityName",
                table: "ActionLogs");

            migrationBuilder.DropColumn(
                name: "EntityId",
                table: "ActionLogs");

            // Make UserId nullable
            migrationBuilder.AlterColumn<int>(
                name: "UserId",
                table: "ActionLogs",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            // Add new structured audit columns
            migrationBuilder.AddColumn<string>(
                name: "LogLevel",
                table: "ActionLogs",
                type: "varchar(20)",
                unicode: false,
                maxLength: 20,
                nullable: false,
                defaultValue: "INFO");

            migrationBuilder.AddColumn<string>(
                name: "ActionName",
                table: "ActionLogs",
                type: "varchar(100)",
                unicode: false,
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "HttpMethod",
                table: "ActionLogs",
                type: "varchar(10)",
                unicode: false,
                maxLength: 10,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ActorEmail",
                table: "ActionLogs",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ActorRole",
                table: "ActionLogs",
                type: "varchar(50)",
                unicode: false,
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IpAddress",
                table: "ActionLogs",
                type: "varchar(45)",
                unicode: false,
                maxLength: 45,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TargetId",
                table: "ActionLogs",
                type: "varchar(100)",
                unicode: false,
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TargetType",
                table: "ActionLogs",
                type: "varchar(100)",
                unicode: false,
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DetailJson",
                table: "ActionLogs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UserAgent",
                table: "ActionLogs",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SessionId",
                table: "ActionLogs",
                type: "varchar(100)",
                unicode: false,
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Location",
                table: "ActionLogs",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "StatusCode",
                table: "ActionLogs",
                type: "int",
                nullable: false,
                defaultValue: 0);

            // Indexes
            migrationBuilder.CreateIndex(
                name: "IX_ActionLogs_ActionName",
                table: "ActionLogs",
                column: "ActionName");

            migrationBuilder.CreateIndex(
                name: "IX_ActionLogs_LogLevel",
                table: "ActionLogs",
                column: "LogLevel");

            migrationBuilder.CreateIndex(
                name: "IX_ActionLogs_Timestamp",
                table: "ActionLogs",
                column: "Timestamp");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ActionLogs_ActionName",
                table: "ActionLogs");

            migrationBuilder.DropIndex(
                name: "IX_ActionLogs_LogLevel",
                table: "ActionLogs");

            migrationBuilder.DropIndex(
                name: "IX_ActionLogs_Timestamp",
                table: "ActionLogs");

            migrationBuilder.DropColumn(name: "LogLevel", table: "ActionLogs");
            migrationBuilder.DropColumn(name: "ActionName", table: "ActionLogs");
            migrationBuilder.DropColumn(name: "HttpMethod", table: "ActionLogs");
            migrationBuilder.DropColumn(name: "ActorEmail", table: "ActionLogs");
            migrationBuilder.DropColumn(name: "ActorRole", table: "ActionLogs");
            migrationBuilder.DropColumn(name: "IpAddress", table: "ActionLogs");
            migrationBuilder.DropColumn(name: "TargetId", table: "ActionLogs");
            migrationBuilder.DropColumn(name: "TargetType", table: "ActionLogs");
            migrationBuilder.DropColumn(name: "DetailJson", table: "ActionLogs");
            migrationBuilder.DropColumn(name: "UserAgent", table: "ActionLogs");
            migrationBuilder.DropColumn(name: "SessionId", table: "ActionLogs");
            migrationBuilder.DropColumn(name: "Location", table: "ActionLogs");
            migrationBuilder.DropColumn(name: "StatusCode", table: "ActionLogs");

            migrationBuilder.AddColumn<string>(name: "ActionType", table: "ActionLogs", type: "varchar(50)", nullable: false, defaultValue: "");
            migrationBuilder.AddColumn<string>(name: "EntityName", table: "ActionLogs", type: "varchar(50)", nullable: false, defaultValue: "");
            migrationBuilder.AddColumn<int>(name: "EntityId", table: "ActionLogs", type: "int", nullable: false, defaultValue: 0);

            migrationBuilder.AlterColumn<int>(
                name: "UserId",
                table: "ActionLogs",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);
        }
    }
}
