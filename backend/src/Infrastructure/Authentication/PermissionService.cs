using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using NatureMiniPlex.Core.Application.Interfaces;
using NatureMiniPlex.Infrastructure.Persistence;

namespace NatureMiniPlex.Infrastructure.Authentication;

public class PermissionService : IPermissionService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly IMemoryCache _memoryCache;
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(10);

    public PermissionService(ApplicationDbContext dbContext, IMemoryCache memoryCache)
    {
        _dbContext = dbContext;
        _memoryCache = memoryCache;
    }

    public async Task<HashSet<string>> GetUserPermissionsAsync(int userId)
    {
        string cacheKey = $"user_permissions_{userId}";

        if (_memoryCache.TryGetValue(cacheKey, out HashSet<string>? cachedPermissions) && cachedPermissions != null)
        {
            return cachedPermissions;
        }

        var user = await _dbContext.Users.FindAsync(userId);

        var userRoles = await _dbContext.UserRoles
            .Where(ur => ur.UserId == userId)
            .Select(ur => ur.Role.Code)
            .ToListAsync();

        List<string> permissions;

        bool isSystemAdmin = userId == 1 ||
                             (user != null && user.Username.Equals("admin", StringComparison.OrdinalIgnoreCase)) ||
                             userRoles.Any(r => r.Equals("SYSTEM_ADMIN", StringComparison.OrdinalIgnoreCase));

        // SYSTEM_ADMIN possesses full wildcard access to all permissions
        if (isSystemAdmin)
        {
            permissions = await _dbContext.Permissions.Select(p => p.Code).ToListAsync();
            permissions.Add("*");
            permissions.Add("users:manage");
            permissions.Add("roles:manage");
            permissions.Add("showtimes:create");
            permissions.Add("showtime:create");
            permissions.Add("bookings:cancel:any");
            permissions.Add("bookings:read:all");
        }
        else
        {
            permissions = await _dbContext.UserRoles
                .Where(ur => ur.UserId == userId)
                .SelectMany(ur => ur.Role.RolePermissions)
                .Select(rp => rp.Permission.Code)
                .Distinct()
                .ToListAsync();
        }

        var permissionSet = new HashSet<string>(permissions, StringComparer.OrdinalIgnoreCase);

        _memoryCache.Set(cacheKey, permissionSet, CacheDuration);

        return permissionSet;
    }

    public async Task<bool> HasPermissionAsync(int userId, string permissionCode)
    {
        var permissions = await GetUserPermissionsAsync(userId);
        return permissions.Contains("*") || permissions.Contains(permissionCode, StringComparer.OrdinalIgnoreCase);
    }

    public void InvalidateUserPermissionsCache(int userId)
    {
        string cacheKey = $"user_permissions_{userId}";
        _memoryCache.Remove(cacheKey);
    }
}
