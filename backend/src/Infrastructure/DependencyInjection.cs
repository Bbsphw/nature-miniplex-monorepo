using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using NatureMiniPlex.Core.Application.Interfaces;
using NatureMiniPlex.Core.Application.Interfaces.Repositories;
using NatureMiniPlex.Infrastructure.Persistence;
using NatureMiniPlex.Infrastructure.Repositories;

namespace NatureMiniPlex.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<ICinemaRepository, CinemaRepository>();
        services.AddScoped<IMovieRepository, MovieRepository>();
        services.AddScoped<IShowtimeRepository, ShowtimeRepository>();
        services.AddScoped<IBookingRepository, BookingRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        services.AddOptions<Authentication.JwtSettings>()
            .Bind(configuration.GetSection(Authentication.JwtSettings.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();
        services.AddSingleton<NatureMiniPlex.Core.Application.Interfaces.IJwtTokenGenerator, Authentication.JwtTokenGenerator>();
        services.AddSingleton<NatureMiniPlex.Core.Application.Interfaces.IPasswordHasher, Authentication.PasswordHasher>();
        
        services.Configure<NatureMiniPlex.Infrastructure.Services.SmtpSettings>(configuration.GetSection("SmtpSettings"));
        services.AddTransient<IEmailService, NatureMiniPlex.Infrastructure.Services.EmailService>();

        return services;
    }
}
