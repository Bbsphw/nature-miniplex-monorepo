using System.Collections.Generic;
using System.Threading.Tasks;

namespace NatureMiniPlex.Core.Application.Interfaces;

public interface IPermissionService
{
    Task<HashSet<string>> GetUserPermissionsAsync(int userId);
    Task<bool> HasPermissionAsync(int userId, string permissionCode);
    void InvalidateUserPermissionsCache(int userId);
}
