using Microsoft.EntityFrameworkCore;
using NatureMiniPlex.Core.Application;
using NatureMiniPlex.Infrastructure;
using NatureMiniPlex.Infrastructure.Persistence;

DotNetEnv.Env.Load();
var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddMemoryCache();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(_ => true) // Allow all localhost / local network origins for frontend dev
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "Nature MiniPlex API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. \r\n\r\n Enter 'Bearer' [space] and then your token in the text input below.\r\n\r\nExample: \"Bearer 12345abcdef\"",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement()
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = Microsoft.OpenApi.Models.ParameterLocation.Header,
            },
            new System.Collections.Generic.List<string>()
        }
    });
});

var jwtSettingsSection = builder.Configuration.GetSection(NatureMiniPlex.Infrastructure.Authentication.JwtSettings.SectionName);
var secret = jwtSettingsSection.GetValue<string>("Secret");

if (!string.IsNullOrEmpty(secret))
{
    builder.Services.AddAuthentication(Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtSettingsSection.GetValue<string>("Issuer"),
                ValidAudience = jwtSettingsSection.GetValue<string>("Audience"),
                IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(secret))
            };
        });
    builder.Services.AddAuthorization();
}

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

// 1. CORS Policy MUST be applied FIRST so all requests (including errors & OPTIONS) carry CORS headers
app.UseCors("AllowFrontend");

// 2. Exception Handling Middleware
app.UseMiddleware<NatureMiniPlex.API.Middlewares.ExceptionHandlingMiddleware>();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Testing"))
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (app.Environment.IsDevelopment())
{
    using (var scope = app.Services.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        try {
            context.Database.Migrate(); // Apply pending migrations automatically
            await NatureMiniPlex.Infrastructure.Persistence.DbInitializer.InitializeAsync(context);
        } catch (Exception ex) {
            Console.WriteLine($"Error during DB initialization: {ex.Message}");
        }
    }
}

app.UseAuthentication();
app.UseAuthorization();

// 3. Action Logging Middleware
app.UseMiddleware<NatureMiniPlex.API.Middlewares.ActionLoggingMiddleware>();

app.MapControllers();

app.Run();

public partial class Program { }