using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using NatureMiniPlex.Core.Application.Interfaces.Repositories;
using NatureMiniPlex.Core.Domain.Entities;
using NatureMiniPlex.Infrastructure.Persistence;

namespace NatureMiniPlex.Infrastructure.Repositories;

public class MovieRepository : Repository<Movie>, IMovieRepository
{
    public MovieRepository(ApplicationDbContext dbContext) : base(dbContext)
    {
    }

    public override async Task<Movie?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet.IgnoreQueryFilters().FirstOrDefaultAsync(m => m.Id == id, cancellationToken);
    }

    public override async Task<IReadOnlyList<Movie>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet.IgnoreQueryFilters().ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Movie>> GetActiveMoviesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(m => m.IsActive)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> ExistsAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _dbSet.IgnoreQueryFilters().AnyAsync(m => m.Id == id, cancellationToken);
    }
}
