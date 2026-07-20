using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NatureMiniPlex.Core.Application.Interfaces.Repositories;
using NatureMiniPlex.Core.Domain.Entities;
using NatureMiniPlex.Infrastructure.Persistence;

namespace NatureMiniPlex.Infrastructure.Repositories;

public class CinemaRepository : Repository<Cinema>, ICinemaRepository
{
    public CinemaRepository(ApplicationDbContext dbContext) : base(dbContext)
    {
    }

    public async Task<Cinema?> GetCinemaWithSeatsAsync(int cinemaId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(c => c.Seats)
            .FirstOrDefaultAsync(c => c.Id == cinemaId, cancellationToken);
    }
}
