using System;
using System.Collections.Generic;

namespace NatureMiniPlex.Core.Application.Interfaces;

public interface ICurrentUserService
{
    int? UserId { get; }
    string? Username { get; }
    string? Email { get; }
    int? CinemaId { get; }
    bool IsAuthenticated { get; }
    IEnumerable<string> Roles { get; }
    Task<bool> HasPermissionAsync(string permissionCode);
}
