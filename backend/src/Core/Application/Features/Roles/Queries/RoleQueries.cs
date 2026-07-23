using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using NatureMiniPlex.Core.Application.DTOs.Users;
using NatureMiniPlex.Core.Application.Interfaces.Repositories;
using NatureMiniPlex.Core.Domain.Entities;

namespace NatureMiniPlex.Core.Application.Features.Roles.Queries;

public record GetRolesQuery : IRequest<IReadOnlyList<RoleDto>>;

public class GetRolesQueryHandler : IRequestHandler<GetRolesQuery, IReadOnlyList<RoleDto>>
{
    private readonly IRepository<Role> _roleRepository;
    private readonly IRepository<RolePermission> _rolePermissionRepository;
    private readonly IRepository<Permission> _permissionRepository;

    public GetRolesQueryHandler(
        IRepository<Role> roleRepository,
        IRepository<RolePermission> rolePermissionRepository,
        IRepository<Permission> permissionRepository)
    {
        _roleRepository = roleRepository;
        _rolePermissionRepository = rolePermissionRepository;
        _permissionRepository = permissionRepository;
    }

    public async Task<IReadOnlyList<RoleDto>> Handle(GetRolesQuery request, CancellationToken cancellationToken)
    {
        var roles = await _roleRepository.GetAllAsync(cancellationToken);
        var allRolePermissions = await _rolePermissionRepository.GetAllAsync(cancellationToken);
        var allPermissions = await _permissionRepository.GetAllAsync(cancellationToken);

        return roles.Select(r => {
            var myPermIds = allRolePermissions.Where(rp => rp.RoleId == r.Id).Select(rp => rp.PermissionId).ToList();
            var myPerms = allPermissions.Where(p => myPermIds.Contains(p.Id)).Select(p => p.Code).ToList();

            return new RoleDto
            {
                Id = r.Id,
                Code = r.Code,
                Name = r.Name,
                Description = r.Description,
                IsSystemRole = r.IsSystemRole,
                Permissions = myPerms,
                PermissionIds = myPermIds
            };
        }).ToList();
    }
}


public record GetPermissionsQuery : IRequest<IReadOnlyList<PermissionDto>>;

public class GetPermissionsQueryHandler : IRequestHandler<GetPermissionsQuery, IReadOnlyList<PermissionDto>>
{
    private readonly IRepository<Permission> _permissionRepository;

    public GetPermissionsQueryHandler(IRepository<Permission> permissionRepository)
    {
        _permissionRepository = permissionRepository;
    }

    public async Task<IReadOnlyList<PermissionDto>> Handle(GetPermissionsQuery request, CancellationToken cancellationToken)
    {
        var perms = await _permissionRepository.GetAllAsync(cancellationToken);
        return perms.Select(p => new PermissionDto
        {
            Id = p.Id,
            Code = p.Code,
            Resource = p.Resource,
            Action = p.Action,
            Description = p.Description
        }).ToList();
    }
}
