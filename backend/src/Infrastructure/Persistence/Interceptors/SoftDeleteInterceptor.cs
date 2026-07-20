using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using NatureMiniPlex.Core.Domain.Entities;
using NatureMiniPlex.Core.Domain.Enums;

namespace NatureMiniPlex.Infrastructure.Persistence.Interceptors;

public class SoftDeleteInterceptor : SaveChangesInterceptor
{
    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        HandleSoftDelete(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
    {
        HandleSoftDelete(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private void HandleSoftDelete(DbContext? context)
    {
        if (context == null) return;

        var entries = context.ChangeTracker.Entries().Where(e => e.State == EntityState.Deleted).ToList();

        foreach (var entry in entries)
        {
            if (entry.Entity is Showtime showtime)
            {
                entry.State = EntityState.Modified;
                showtime.IsActive = false;

                // Cascade to BookingItems
                var bookingItems = context.Set<BookingItem>().Where(bi => bi.ShowtimeId == showtime.Id).ToList();
                foreach (var item in bookingItems)
                {
                    item.ItemStatus = ItemStatus.Canceled;
                    context.Entry(item).State = EntityState.Modified;
                }
            }
            else if (entry.Properties.Any(p => p.Metadata.Name == "IsActive"))
            {
                entry.State = EntityState.Modified;
                entry.Property("IsActive").CurrentValue = false;
            }
        }
    }
}
