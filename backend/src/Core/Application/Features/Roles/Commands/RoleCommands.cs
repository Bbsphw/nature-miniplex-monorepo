using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using NatureMiniPlex.Core.Application.Interfaces;
using NatureMiniPlex.Core.Application.Interfaces.Repositories;
using NatureMiniPlex.Core.Domain.Entities;

namespace NatureMiniPlex.Core.Application.Features.Roles.Commands;

public record UpdateRolePermissionsCommand(int RoleId, List<int> PermissionIds) : IRequest<bool>;

public class UpdateRolePermissionsCommandHandler : IRequestHandler<UpdateRolePermissionsCommand, bool>
{
    private readonly IRepository<Role> _roleRepository;
    private readonly IRepository<RolePermission> _rolePermissionRepository;
    private readonly IRepository<Permission> _permissionRepository;
    private readonly IRepository<User> _userRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPermissionService _permissionService;

    public UpdateRolePermissionsCommandHandler(
        IRepository<Role> roleRepository,
        IRepository<RolePermission> rolePermissionRepository,
        IRepository<Permission> permissionRepository,
        IRepository<User> userRepository,
        IUnitOfWork unitOfWork,
        IPermissionService permissionService)
    {
        _roleRepository = roleRepository;
        _rolePermissionRepository = rolePermissionRepository;
        _permissionRepository = permissionRepository;
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
        _permissionService = permissionService;
    }

    public async Task<bool> Handle(UpdateRolePermissionsCommand request, CancellationToken cancellationToken)
    {
        var roles = await _roleRepository.GetAllAsync(cancellationToken);
        var role = roles.FirstOrDefault(r => r.Id == request.RoleId);

        if (role == null)
        {
            throw new KeyNotFoundException($"Role with ID '{request.RoleId}' was not found.");
        }

        var allPermissions = await _permissionRepository.GetAllAsync(cancellationToken);
        var targetPermissions = allPermissions.Where(p => request.PermissionIds.Contains(p.Id)).ToList();

        // Fetch existing RolePermissions for this role and remove them
        var existingRolePermissions = (await _rolePermissionRepository.GetAllAsync(cancellationToken))
            .Where(rp => rp.RoleId == request.RoleId)
            .ToList();

        if (existingRolePermissions.Any())
        {
            await _rolePermissionRepository.DeleteRangeAsync(existingRolePermissions, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        // Add new RolePermissions
        foreach (var p in targetPermissions)
        {
            await _rolePermissionRepository.AddAsync(new RolePermission { RoleId = role.Id, PermissionId = p.Id, GrantedAt = DateTime.UtcNow }, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Invalidate Cache for all users
        var users = await _userRepository.GetAllAsync(cancellationToken);
        foreach (var u in users)
        {
            _permissionService.InvalidateUserPermissionsCache(u.Id);
        }

        return true;
    }
}



