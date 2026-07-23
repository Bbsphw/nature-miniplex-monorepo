using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using NatureMiniPlex.Core.Domain.Entities;

namespace NatureMiniPlex.Core.Application.Interfaces;

/// <summary>
/// Interface สำหรับจัดเก็บและเรียกดู Action Log (Audit Trail)
/// ออกแบบตามแนวคิด Storage Isolation เพื่อแยก Storage สำหรับ Audit Trail ออกจาก OLTP Primary Data
/// </summary>
public interface IActionLogRepository
{
    /// <summary>
    /// บันทึก Action Log แบบ Append-Only (Write-Only Isolation Pattern)
    /// </summary>
    Task LogAsync(ActionLog actionLog, CancellationToken cancellationToken = default);

    /// <summary>
    /// ดึงรายการ Action Logs สำหรับผู้ดูแลระบบ (Audit Overview)
    /// </summary>
    Task<IReadOnlyList<ActionLog>> GetLogsAsync(int page = 1, int pageSize = 50, CancellationToken cancellationToken = default);
}
