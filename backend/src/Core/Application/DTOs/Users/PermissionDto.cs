namespace NatureMiniPlex.Core.Application.DTOs.Users;

public class PermissionDto
{
    public int Id { get; set; }
    public string Code { get; set; } = null!;
    public string Resource { get; set; } = null!;
    public string Action { get; set; } = null!;
    public string? Description { get; set; }
}
