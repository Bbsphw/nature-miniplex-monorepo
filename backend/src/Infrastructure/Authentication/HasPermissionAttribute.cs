using Microsoft.AspNetCore.Authorization;

namespace NatureMiniPlex.Infrastructure.Authentication;

public class HasPermissionAttribute : AuthorizeAttribute
{
    public HasPermissionAttribute(string permission)
        : base(policy: permission)
    {
    }
}
