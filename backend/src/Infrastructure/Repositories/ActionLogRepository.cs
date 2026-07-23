using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NatureMiniPlex.Core.Application.Interfaces;
using NatureMiniPlex.Core.Domain.Entities;
using NatureMiniPlex.Infrastructure.Persistence;

namespace NatureMiniPlex.Infrastructure.Repositories;

/// <summary>
/// Implementation ของ IActionLogRepository
/// ทำหน้าที่จัดการการบันทึกและสืบค้น Audit Log โดยรองรับ Append-Only Isolation Strategy
/// </summary>
public class ActionLogRepository : IActionLogRepository
{
    private readonly ApplicationDbContext _dbContext;

    public ActionLogRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task LogAsync(ActionLog actionLog, CancellationToken cancellationToken = default)
    {
        if (actionLog == null) throw new ArgumentNullException(nameof(actionLog));

        // ตรวจสอบ Timestamp ให้อยู่ในรูปแบบ UTC เสมอ
        if (actionLog.Timestamp == default)
        {
            actionLog.Timestamp = DateTime.UtcNow;
        }

        await _dbContext.ActionLogs.AddAsync(actionLog, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ActionLog>> GetLogsAsync(int page = 1, int pageSize = 50, CancellationToken cancellationToken = default)
    {
        return await _dbContext.ActionLogs
            .AsNoTracking()
            .Include(a => a.User)
            .OrderByDescending(a => a.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }
}
