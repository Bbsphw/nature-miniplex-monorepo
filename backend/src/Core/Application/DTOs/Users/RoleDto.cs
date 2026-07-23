using System.Collections.Generic;

namespace NatureMiniPlex.Core.Application.DTOs.Users;

public class RoleDto
{
    public int Id { get; set; }
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public bool IsSystemRole { get; set; }
    public List<string> Permissions { get; set; } = new();
    public List<int> PermissionIds { get; set; } = new();
}

