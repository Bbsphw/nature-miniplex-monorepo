using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NatureMiniPlex.Core.Domain.Entities;

namespace NatureMiniPlex.Infrastructure.Persistence;

public static class DbInitializer
{
    public static async Task InitializeAsync(ApplicationDbContext context)
    {
        // 1. Seed Complete Granular Administrative Permissions across all modules
        var permissions = new List<Permission>
        {
            // Bookings Module
            new Permission { Code = "bookings:read:assigned_cinema", Resource = "Bookings", Action = "Read", Description = "ดูรายการจองตั๋วภาพยนตร์ประจำสาขา (Branch Bookings)" },
            new Permission { Code = "bookings:cancel:assigned_cinema", Resource = "Bookings", Action = "Cancel", Description = "ยกเลิกรายการจองตั๋วภาพยนตร์ประจำสาขา (Branch Cancel)" },
            new Permission { Code = "bookings:read:all", Resource = "Bookings", Action = "Read", Description = "ดูรายการจองตั๋วภาพยนตร์ทุกสาขาทั้งระบบ (Global Bookings)" },
            new Permission { Code = "bookings:cancel:any", Resource = "Bookings", Action = "Cancel", Description = "ยกเลิกรายการจองตั๋วภาพยนตร์ได้ทุกสาขาทั้งระบบ (Global Cancel)" },
            new Permission { Code = "bookings:read:own", Resource = "Bookings", Action = "Read", Description = "ดูรายการจองตั๋วของตนเอง (Own Bookings)" },
            new Permission { Code = "bookings:cancel:own", Resource = "Bookings", Action = "Cancel", Description = "ยกเลิกรายการจองตั๋วของตนเอง (Own Cancel)" },

            // Movies Granular CRUD Permissions
            new Permission { Code = "movies:read", Resource = "Movies", Action = "Read", Description = "เข้าถึงรายการภาพยนตร์ (Read Movies)" },
            new Permission { Code = "movies:create", Resource = "Movies", Action = "Create", Description = "เพิ่มภาพยนตร์ใหม่เข้าสู่ระบบ (Create Movie)" },
            new Permission { Code = "movies:update", Resource = "Movies", Action = "Update", Description = "แก้ไขข้อมูลภาพยนตร์ (Update Movie)" },
            new Permission { Code = "movies:delete", Resource = "Movies", Action = "Delete", Description = "ลบหรือยกเลิกภาพยนตร์ออกจากระบบ (Delete Movie)" },
            new Permission { Code = "movies:manage", Resource = "Movies", Action = "Manage", Description = "บริหารจัดการข้อมูลภาพยนตร์ทั้งหมด (Manage Movies)" },

            // Showtimes Granular Create/Update/Cancel/Lock Permissions
            new Permission { Code = "showtimes:read", Resource = "Showtimes", Action = "Read", Description = "ดูรายการรอบฉายภาพยนตร์ (Read Showtimes)" },
            new Permission { Code = "showtimes:create", Resource = "Showtimes", Action = "Create", Description = "เพิ่มรอบฉายภาพยนตร์ใหม่ (Create Showtime)" },
            new Permission { Code = "showtime:create", Resource = "Showtimes", Action = "Create", Description = "เพิ่มรอบฉายภาพยนตร์ (Showtime Alias)" },
            new Permission { Code = "showtimes:update", Resource = "Showtimes", Action = "Update", Description = "แก้ไขเวลารอบฉายและโรงภาพยนตร์ (Update Showtime)" },
            new Permission { Code = "showtimes:cancel", Resource = "Showtimes", Action = "Cancel", Description = "ยกเลิกรอบฉายภาพยนตร์ (Cancel Showtime)" },
            new Permission { Code = "showtimes:lock", Resource = "Showtimes", Action = "Lock", Description = "ล็อกและปิด/เปิดรับจองรอบฉายภาพยนตร์ (Lock/Unlock Showtime)" },
            new Permission { Code = "showtimes:manage", Resource = "Showtimes", Action = "Manage", Description = "บริหารจัดการรอบฉายภาพยนตร์ทั้งหมด (Manage Showtimes)" },

            // Cinemas & Seats Permissions
            new Permission { Code = "cinemas:read", Resource = "Cinemas", Action = "Read", Description = "ดูข้อมูลสาขาโรงภาพยนตร์ (Read Cinemas)" },
            new Permission { Code = "cinemas:manage", Resource = "Cinemas", Action = "Manage", Description = "จัดการข้อมูลสาขาโรงภาพยนตร์ (Manage Cinemas)" },
            new Permission { Code = "seats:read", Resource = "Seats", Action = "Read", Description = "ดูผังที่นั่งโรงภาพยนตร์ (Read Seats)" },
            new Permission { Code = "seats:manage", Resource = "Seats", Action = "Manage", Description = "จัดการผังที่นั่งโรงภาพยนตร์ (Manage Seats)" },

            // System Management & Analytics Permissions
            new Permission { Code = "reports:read", Resource = "Reports", Action = "Read", Description = "ดูรายงานสรุปยอดขายและสถิติภาพยนตร์ (Sales & Analytics)" },
            new Permission { Code = "reports:export", Resource = "Reports", Action = "Export", Description = "ส่งออกรายงานยอดขาย (Export Reports)" },
            new Permission { Code = "users:read", Resource = "Users", Action = "Read", Description = "ดูรายการพนักงานในระบบ (Read Users)" },
            new Permission { Code = "users:create", Resource = "Users", Action = "Create", Description = "สร้างบัญชีพนักงานใหม่ (Create Users)" },
            new Permission { Code = "users:update", Resource = "Users", Action = "Update", Description = "แก้ไขข้อมูลพนักงานและขอบเขตสาขา RLS (Update Users)" },
            new Permission { Code = "users:delete", Resource = "Users", Action = "Delete", Description = "ปิดการใช้งานบัญชีพนักงาน (Disable Users)" },
            new Permission { Code = "users:manage", Resource = "Users", Action = "Manage", Description = "จัดการบัญชีพนักงานและขอบเขตสาขา RLS (Staff Users)" },
            new Permission { Code = "roles:read", Resource = "Roles", Action = "Read", Description = "ดูรายการบทบาทและสิทธิ์ระบบ (Read Roles)" },
            new Permission { Code = "roles:update", Resource = "Roles", Action = "Update", Description = "แก้ไขสิทธิ์ประจำบทบาท (Update Roles)" },
            new Permission { Code = "roles:manage", Resource = "Roles", Action = "Manage", Description = "จัดการบทบาทและกำหนดสิทธิ์ระบบ (Roles & Permission Matrix)" },
            new Permission { Code = "actionlogs:read", Resource = "ActionLogs", Action = "Read", Description = "ดูประวัติการทำงานของพนักงาน (Audit Action Logs)" },
            new Permission { Code = "actionlogs:manage", Resource = "ActionLogs", Action = "Manage", Description = "จัดการประวัติการทำงานของระบบ (Manage Audit Logs)" }
        };

        foreach (var perm in permissions)
        {
            var existing = await context.Permissions.FirstOrDefaultAsync(p => p.Code == perm.Code);
            if (existing == null)
            {
                context.Permissions.Add(perm);
            }
            else
            {
                existing.Resource = perm.Resource;
                existing.Action = perm.Action;
                existing.Description = perm.Description;
            }
        }
        await context.SaveChangesAsync();

        // 2. Seed Default Administrative Roles (Internal Users Only)
        var adminRole = await context.Roles.FirstOrDefaultAsync(r => r.Code == "SYSTEM_ADMIN");
        if (adminRole == null)
        {
            adminRole = new Role
            {
                Code = "SYSTEM_ADMIN",
                Name = "System Administrator",
                Description = "Full administrative access to all Nature MiniPlex management APIs",
                IsSystemRole = true
            };
            context.Roles.Add(adminRole);
        }

        var managerRole = await context.Roles.FirstOrDefaultAsync(r => r.Code == "CINEMA_MANAGER");
        if (managerRole == null)
        {
            managerRole = new Role
            {
                Code = "CINEMA_MANAGER",
                Name = "Cinema Manager",
                Description = "Manages showtimes and ticket cancellations for assigned cinema",
                IsSystemRole = true
            };
            context.Roles.Add(managerRole);
        }

        var staffRole = await context.Roles.FirstOrDefaultAsync(r => r.Code == "COUNTER_STAFF");
        if (staffRole == null)
        {
            staffRole = new Role
            {
                Code = "COUNTER_STAFF",
                Name = "Counter Staff",
                Description = "Counter ticketing staff with branch-level access",
                IsSystemRole = true
            };
            context.Roles.Add(staffRole);
        }
        await context.SaveChangesAsync();

        // 3. Assign Permissions to Administrative Roles
        var allPermissions = await context.Permissions.ToListAsync();

        // Admin: All Permissions
        foreach (var p in allPermissions)
        {
            if (!await context.RolePermissions.AnyAsync(rp => rp.RoleId == adminRole.Id && rp.PermissionId == p.Id))
            {
                context.RolePermissions.Add(new RolePermission { RoleId = adminRole.Id, PermissionId = p.Id });
            }
        }

        // Manager: Cinema-scoped, showtime management, movies, and reports permissions
        var managerPermCodes = new[] {
            "bookings:read:assigned_cinema",
            "bookings:cancel:assigned_cinema",
            "showtimes:read",
            "showtimes:create",
            "showtime:create",
            "showtimes:update",
            "showtimes:cancel",
            "showtimes:lock",
            "showtimes:manage",
            "movies:read",
            "movies:create",
            "movies:update",
            "movies:delete",
            "movies:manage",
            "reports:read",
            "actionlogs:read"
        };
        foreach (var code in managerPermCodes)
        {
            var p = allPermissions.FirstOrDefault(x => x.Code == code);
            if (p != null && !await context.RolePermissions.AnyAsync(rp => rp.RoleId == managerRole.Id && rp.PermissionId == p.Id))
            {
                context.RolePermissions.Add(new RolePermission { RoleId = managerRole.Id, PermissionId = p.Id });
            }
        }

        // Counter Staff: Counter ticketing & branch-scoped view permissions
        var staffPermCodes = new[] {
            "bookings:read:assigned_cinema",
            "showtimes:read",
            "movies:read"
        };
        foreach (var code in staffPermCodes)
        {
            var p = allPermissions.FirstOrDefault(x => x.Code == code);
            if (p != null && !await context.RolePermissions.AnyAsync(rp => rp.RoleId == staffRole.Id && rp.PermissionId == p.Id))
            {
                context.RolePermissions.Add(new RolePermission { RoleId = staffRole.Id, PermissionId = p.Id });
            }
        }
        await context.SaveChangesAsync();

        // 4. Seed Default Admin User
        var adminUser = await context.Users.FirstOrDefaultAsync(u => u.Username == "admin");
        if (adminUser == null)
        {
            string hashedAdminPassword = BCrypt.Net.BCrypt.EnhancedHashPassword("Password123!", 11);
            adminUser = new User
            {
                Username = "admin",
                PasswordHash = hashedAdminPassword,
                Email = "admin@natureminiplex.com",
                IsActive = true
            };
            context.Users.Add(adminUser);
            await context.SaveChangesAsync();
        }
        else
        {
            adminUser.IsActive = true;
            await context.SaveChangesAsync();
        }

        if (!await context.UserRoles.AnyAsync(ur => ur.UserId == adminUser.Id && ur.RoleId == adminRole.Id))
        {
            context.UserRoles.Add(new UserRole { UserId = adminUser.Id, RoleId = adminRole.Id });
            await context.SaveChangesAsync();
        }

        // 5. Seed Default Cinemas & Seats
        if (!context.Cinemas.Any(c => c.Name == "Sriracha"))
        {
            var sriracha = new Cinema { Name = "Sriracha", IsActive = true, TotalSeats = 6 };
            context.Cinemas.Add(sriracha);
            await context.SaveChangesAsync();

            var srirachaSeats = new List<Seat>();
            string[] cols = { "A", "B", "C" };
            for (int r = 1; r <= 2; r++)
            {
                for (int c = 0; c < cols.Length; c++)
                {
                    srirachaSeats.Add(new Seat { CinemaId = sriracha.Id, RowName = r.ToString(), ColumnName = cols[c] });
                }
            }
            context.Seats.AddRange(srirachaSeats);
            await context.SaveChangesAsync();
        }

        if (!context.Cinemas.Any(c => c.Name == "Bangsaen"))
        {
            var bangsaen = new Cinema { Name = "Bangsaen", IsActive = true, TotalSeats = 6 };
            context.Cinemas.Add(bangsaen);
            await context.SaveChangesAsync();

            var bangsaenSeats = new List<Seat>();
            string[] cols = { "A", "B", "C" };
            for (int r = 1; r <= 2; r++)
            {
                for (int c = 0; c < cols.Length; c++)
                {
                    bangsaenSeats.Add(new Seat { CinemaId = bangsaen.Id, RowName = r.ToString(), ColumnName = cols[c] });
                }
            }
            context.Seats.AddRange(bangsaenSeats);
            await context.SaveChangesAsync();
        }

        // 6. Seed Initial Audit Action Logs if empty
        if (!await context.ActionLogs.AnyAsync())
        {
            var adminUserRef = await context.Users.FirstOrDefaultAsync(u => u.Username == "admin");
            int adminId = adminUserRef?.Id ?? 1;

            context.ActionLogs.AddRange(
                new ActionLog
                {
                    UserId = adminId,
                    ActionType = "SYSTEM_INITIALIZE",
                    EntityName = "System",
                    EntityId = 1,
                    Timestamp = DateTime.UtcNow.AddMinutes(-30)
                },
                new ActionLog
                {
                    UserId = adminId,
                    ActionType = "SEED_RBAC_PERMISSIONS",
                    EntityName = "Permission",
                    EntityId = 1,
                    Timestamp = DateTime.UtcNow.AddMinutes(-20)
                },
                new ActionLog
                {
                    UserId = adminId,
                    ActionType = "CREATE_USER",
                    EntityName = "User",
                    EntityId = adminId,
                    Timestamp = DateTime.UtcNow.AddMinutes(-10)
                }
            );
            await context.SaveChangesAsync();
        }
    }
}
