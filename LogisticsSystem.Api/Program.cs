using System.Text;
using System.Text.Json.Serialization;
using LogisticsSystem.Api.ExceptionHandlers;
using LogisticsSystem.Application.DTOs;
using LogisticsSystem.Application.Interfaces;
using LogisticsSystem.Application.Mapping;
using LogisticsSystem.Application.UseCases.Auth.Login;
using LogisticsSystem.Application.UseCases.Shipments.Commands.AssignBranch;
using LogisticsSystem.Application.UseCases.Shipments.Commands.AssignCourier;
using LogisticsSystem.Application.UseCases.Cash.Queries.GetCashSummary;
using LogisticsSystem.Application.UseCases.Shipments.Commands.CollectShipmentPayment;
using LogisticsSystem.Application.UseCases.Shipments.Commands.CreateShipment;
using LogisticsSystem.Application.UseCases.Shipments.Commands.UpdateShipmentStatus;
using LogisticsSystem.Application.UseCases.Branches.Commands.CreateBranch;
using LogisticsSystem.Application.UseCases.Branches.Commands.SetBranchStatus;
using LogisticsSystem.Application.UseCases.Branches.Commands.UpdateBranch;
using LogisticsSystem.Application.UseCases.Branches.Queries.GetBranchesPage;
using LogisticsSystem.Application.UseCases.Couriers.Commands.CreateCourier;
using LogisticsSystem.Application.UseCases.Couriers.Commands.SetCourierStatus;
using LogisticsSystem.Application.UseCases.Couriers.Commands.UpdateCourier;
using LogisticsSystem.Application.UseCases.Couriers.Queries.GetCouriersPage;
using LogisticsSystem.Application.UseCases.Vehicles.Commands.CreateVehicle;
using LogisticsSystem.Application.UseCases.Vehicles.Commands.SetVehicleStatus;
using LogisticsSystem.Application.UseCases.Vehicles.Commands.UpdateVehicle;
using LogisticsSystem.Application.UseCases.Vehicles.Queries.GetVehiclesPage;
using LogisticsSystem.Application.UseCases.Shipments.Queries.GetShipmentById;
using LogisticsSystem.Application.UseCases.Shipments.Queries.GetShipmentByTrackingNumber;
using LogisticsSystem.Application.UseCases.Shipments.Queries.GetShipmentMetrics;
using LogisticsSystem.Application.UseCases.Shipments.Queries.GetShipmentsPage;
using LogisticsSystem.Application.UseCases.Users.Commands.CreateStaffUser;
using LogisticsSystem.Application.UseCases.Users.Commands.SetStaffUserStatus;
using LogisticsSystem.Application.UseCases.Users.Commands.UpdateStaffUser;
using LogisticsSystem.Application.UseCases.Users.Queries.GetUsersPage;
using LogisticsSystem.Domain.Constants;
using LogisticsSystem.Domain.Entities;
using LogisticsSystem.Domain.Enums;
using LogisticsSystem.Infrastructure.Hubs;
using LogisticsSystem.Infrastructure.Persistence;
using LogisticsSystem.Infrastructure.Persistence.Repositories;
using LogisticsSystem.Infrastructure.Services;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

builder.Services.AddDbContext<LogisticsDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssembly(typeof(CreateShipmentCommand).Assembly));

builder.Services.AddScoped<IShipmentRepository, ShipmentRepository>();
builder.Services.AddScoped<IVehicleRepository, VehicleRepository>();
builder.Services.AddScoped<ICourierRepository, CourierRepository>();
builder.Services.AddScoped<IBranchRepository, BranchRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ICurrentUserService, HttpContextCurrentUserService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IShipmentNotificationService, ShipmentNotificationService>();
builder.Services.AddSingleton<IJwtTokenService, JwtTokenService>();
builder.Services.AddSingleton<IPasswordHasher, BcryptPasswordHasher>();

builder.Services.AddSignalR();

builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

const string AllowFrontendPolicy = "AllowFrontend";

builder.Services.AddCors(options =>
{
    options.AddPolicy(AllowFrontendPolicy, policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSection["Key"]
    ?? throw new InvalidOperationException("Jwt:Key is not configured.");
var jwtIssuer = jwtSection["Issuer"]
    ?? throw new InvalidOperationException("Jwt:Issuer is not configured.");
var jwtAudience = jwtSection["Audience"]
    ?? throw new InvalidOperationException("Jwt:Audience is not configured.");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            RoleClaimType = System.Security.Claims.ClaimTypes.Role,
            ClockSkew = TimeSpan.Zero,
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddHealthChecks();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<LogisticsDbContext>();
    db.Database.Migrate();
}

app.UseExceptionHandler();

app.UseCors(AllowFrontendPolicy);

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health");

app.MapPost("/api/auth/login", async (
        LoginCommand command,
        IMediator mediator,
        CancellationToken cancellationToken) =>
    {
        var token = await mediator.Send(command, cancellationToken);
        return token is null
            ? Results.Unauthorized()
            : Results.Ok(new { token });
    })
    .WithName("Login")
    .WithTags("Auth")
    .AllowAnonymous()
    .Produces(StatusCodes.Status200OK)
    .Produces(StatusCodes.Status401Unauthorized);

app.MapGet("/api/auth/me", async (
        ICurrentUserService currentUserService,
        IUserRepository userRepository,
        CancellationToken cancellationToken) =>
    {
        var context = await currentUserService.GetCurrentUserAsync(cancellationToken);
        if (context is null)
        {
            return Results.Unauthorized();
        }

        var user = await userRepository.GetByIdAsync(context.UserId, cancellationToken);
        if (user is null)
        {
            return Results.Unauthorized();
        }

        return Results.Ok(new CurrentUserProfileResponse(
            user.Id,
            user.Username,
            user.Role,
            user.BranchId,
            user.Branch?.Name));
    })
    .WithName("GetCurrentUserProfile")
    .WithTags("Auth")
    .RequireAuthorization()
    .Produces<CurrentUserProfileResponse>(StatusCodes.Status200OK)
    .Produces(StatusCodes.Status401Unauthorized);

var users = app.MapGroup("/api/users")
    .WithTags("Users")
    .RequireAuthorization(policy => policy.RequireRole(UserRoles.Admin));

users.MapGet("/", async (
        int page = 1,
        int pageSize = 10,
        string? search = null,
        IMediator mediator = null!,
        CancellationToken cancellationToken = default) =>
    Results.Ok(await mediator.Send(
        new GetUsersPageQuery(page, pageSize, search),
        cancellationToken)))
    .Produces<PagedResult<StaffUserDto>>(StatusCodes.Status200OK);

users.MapPost("/", async (
        CreateStaffUserRequest request,
        IMediator mediator,
        CancellationToken cancellationToken) =>
    {
        var created = await mediator.Send(
            new CreateStaffUserCommand(
                request.Username,
                request.Password,
                request.Role,
                request.BranchId),
            cancellationToken);

        return Results.Created($"/api/users/{created.Id}", created);
    })
    .Produces<StaffUserDto>(StatusCodes.Status201Created)
    .Produces(StatusCodes.Status400BadRequest)
    .Produces(StatusCodes.Status409Conflict);

users.MapPut("/{id:guid}", async (
        Guid id,
        UpdateStaffUserRequest request,
        IMediator mediator,
        CancellationToken cancellationToken) =>
    Results.Ok(await mediator.Send(
        new UpdateStaffUserCommand(
            id,
            request.Username,
            request.Role,
            request.BranchId,
            request.Password),
        cancellationToken)))
    .Produces<StaffUserDto>(StatusCodes.Status200OK)
    .Produces(StatusCodes.Status400BadRequest)
    .Produces(StatusCodes.Status404NotFound)
    .Produces(StatusCodes.Status409Conflict);

users.MapPatch("/{id:guid}/status", async (
        Guid id,
        SetStaffUserStatusRequest request,
        IMediator mediator,
        CancellationToken cancellationToken) =>
    Results.Ok(await mediator.Send(
        new SetStaffUserStatusCommand(id, request.IsActive),
        cancellationToken)))
    .Produces<StaffUserDto>(StatusCodes.Status200OK)
    .Produces(StatusCodes.Status400BadRequest)
    .Produces(StatusCodes.Status404NotFound);

app.MapPost("/api/users/register-client", async (
        RegisterClientRequest request,
        LogisticsDbContext db,
        IPasswordHasher passwordHasher,
        CancellationToken cancellationToken) =>
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(request.Username);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.Password);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.Dni);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.FullName);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.Email);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.Phone);

        if (await db.Users.AnyAsync(u => u.Username == request.Username, cancellationToken))
        {
            return Results.Conflict(new { detail = "Username already exists." });
        }

        if (await db.Customers.AnyAsync(c => c.Dni == request.Dni, cancellationToken))
        {
            return Results.Conflict(new { detail = "A customer with this DNI already exists." });
        }

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var customer = new Customer(
                Guid.NewGuid(),
                request.Dni.Trim(),
                request.FullName.Trim(),
                request.Email.Trim(),
                request.Phone.Trim());

            db.Customers.Add(customer);
            await db.SaveChangesAsync(cancellationToken);

            var user = new User(
                Guid.NewGuid(),
                request.Username.Trim(),
                passwordHasher.Hash(request.Password),
                UserRoles.Client,
                customer.Id);

            db.Users.Add(user);
            await db.SaveChangesAsync(cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            return Results.Created(
                $"/api/users/{user.Id}",
                new RegisterClientResponse(
                    user.Id,
                    user.Username,
                    user.Role,
                    customer.Id,
                    customer.Dni,
                    customer.FullName));
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    })
    .WithName("RegisterClient")
    .WithTags("Users")
    .AllowAnonymous()
    .Produces<RegisterClientResponse>(StatusCodes.Status201Created)
    .Produces(StatusCodes.Status400BadRequest)
    .Produces(StatusCodes.Status409Conflict);

app.MapPost("/api/shipments", async (
        CreateShipmentRequestDto request,
        IMediator mediator,
        CancellationToken cancellationToken) =>
    {
        if (request.DeliveryType == DeliveryType.BranchPickup && request.DestinationBranchId is null)
        {
            return Results.BadRequest(new
            {
                detail = "DestinationBranchId is required when DeliveryType is BranchPickup.",
            });
        }

        var command = new CreateShipmentCommand(
            request.Origin,
            request.Destination,
            request.WeightInKg,
            request.Pin,
            request.PaymentMethod,
            request.Type,
            request.Size,
            request.IsFragile,
            request.ContentDescription,
            request.PickupRequired,
            request.DeliveryType,
            request.SenderId,
            request.RecipientId,
            request.CurrentBranchId,
            request.DestinationBranchId,
            request.ShippingAmount);

        var receipt = await mediator.Send(command, cancellationToken);
        return Results.Created($"/api/shipments/{receipt.Id}", receipt);
    })
    .WithName("CreateShipment")
    .WithTags("Shipments")
    .RequireAuthorization()
    .Produces<ShipmentReceiptDto>(StatusCodes.Status201Created)
    .Produces(StatusCodes.Status400BadRequest)
    .Produces(StatusCodes.Status401Unauthorized);

app.MapGet("/api/shipments", async (
        IMediator mediator,
        CancellationToken cancellationToken,
        int page = 1,
        int pageSize = 10,
        ShipmentStatus? status = null,
        string? statuses = null,
        string? search = null,
        PaymentMethod? paymentMethod = null,
        bool? isPaid = null,
        DateTime? createdFrom = null,
        DateTime? createdTo = null) =>
    {
        var result = await mediator.Send(
            new GetShipmentsPageQuery(
                page,
                pageSize,
                status,
                statuses,
                search,
                paymentMethod,
                isPaid,
                createdFrom,
                createdTo),
            cancellationToken);
        return Results.Ok(result);
    })
    .WithName("GetShipmentsPage")
    .WithTags("Shipments")
    .RequireAuthorization()
    .Produces<PagedResult<ShipmentDto>>(StatusCodes.Status200OK)
    .Produces(StatusCodes.Status401Unauthorized);

app.MapGet("/api/shipments/metrics", async (
        IMediator mediator,
        CancellationToken cancellationToken) =>
    {
        var metrics = await mediator.Send(new GetShipmentMetricsQuery(), cancellationToken);
        return Results.Ok(metrics);
    })
    .WithName("GetShipmentMetrics")
    .WithTags("Shipments")
    .RequireAuthorization()
    .Produces<ShipmentMetricsDto>(StatusCodes.Status200OK)
    .Produces(StatusCodes.Status401Unauthorized);

app.MapPatch("/api/shipments/{id:guid}/collect-payment", async (
        Guid id,
        IMediator mediator,
        CancellationToken cancellationToken) =>
    Results.Ok(await mediator.Send(new CollectShipmentPaymentCommand(id), cancellationToken)))
    .WithName("CollectShipmentPayment")
    .WithTags("Cash")
    .RequireAuthorization(policy => policy.RequireRole(UserRoles.Admin, UserRoles.Worker))
    .Produces<ShipmentDto>(StatusCodes.Status200OK)
    .Produces(StatusCodes.Status400BadRequest)
    .Produces(StatusCodes.Status404NotFound);

var cash = app.MapGroup("/api/cash")
    .WithTags("Cash")
    .RequireAuthorization(policy => policy.RequireRole(UserRoles.Admin, UserRoles.Worker));

cash.MapGet("/summary", async (IMediator mediator, CancellationToken cancellationToken) =>
    Results.Ok(await mediator.Send(new GetCashSummaryQuery(), cancellationToken)))
    .Produces<CashSummaryDto>(StatusCodes.Status200OK);

app.MapGet("/api/shipments/{id:guid}", async (
        Guid id,
        IMediator mediator,
        CancellationToken cancellationToken) =>
    {
        var shipment = await mediator.Send(new GetShipmentByIdQuery(id), cancellationToken);
        return shipment is null ? Results.NotFound() : Results.Ok(shipment);
    })
    .WithName("GetShipmentById")
    .WithTags("Shipments")
    .RequireAuthorization()
    .Produces<ShipmentDto>(StatusCodes.Status200OK)
    .Produces(StatusCodes.Status401Unauthorized)
    .Produces(StatusCodes.Status404NotFound);

app.MapGet("/api/shipments/track/{trackingNumber}", async (
        string trackingNumber,
        IMediator mediator,
        CancellationToken cancellationToken) =>
    {
        var result = await mediator.Send(
            new GetShipmentByTrackingNumberQuery(trackingNumber),
            cancellationToken);
        return result is null ? Results.NotFound() : Results.Ok(result);
    })
    .WithName("TrackShipment")
    .WithTags("Tracking")
    .AllowAnonymous()
    .Produces<PublicShipmentDto>(StatusCodes.Status200OK)
    .Produces(StatusCodes.Status404NotFound);

app.MapPatch("/api/shipments/{id:guid}/status", async (
        Guid id,
        UpdateShipmentStatusRequest request,
        IMediator mediator,
        CancellationToken cancellationToken) =>
    {
        await mediator.Send(
            new UpdateShipmentStatusCommand(
                id,
                request.NewStatus,
                request.Pin,
                request.PaymentCollected),
            cancellationToken);
        return Results.NoContent();
    })
    .WithName("UpdateShipmentStatus")
    .WithTags("Shipments")
    .RequireAuthorization()
    .Produces(StatusCodes.Status204NoContent)
    .Produces(StatusCodes.Status400BadRequest)
    .Produces(StatusCodes.Status401Unauthorized)
    .Produces(StatusCodes.Status404NotFound);

app.MapPatch("/api/shipments/{id:guid}/courier", async (
        Guid id,
        AssignCourierRequest request,
        IMediator mediator,
        CancellationToken cancellationToken) =>
    {
        await mediator.Send(
            new AssignCourierCommand(id, request.CourierId),
            cancellationToken);
        return Results.NoContent();
    })
    .WithName("AssignCourierToShipment")
    .WithTags("Shipments")
    .RequireAuthorization()
    .Produces(StatusCodes.Status204NoContent)
    .Produces(StatusCodes.Status400BadRequest)
    .Produces(StatusCodes.Status401Unauthorized)
    .Produces(StatusCodes.Status404NotFound);

app.MapPatch("/api/shipments/{id:guid}/branch", async (
        Guid id,
        AssignBranchRequest request,
        IMediator mediator,
        CancellationToken cancellationToken) =>
    {
        await mediator.Send(
            new AssignBranchCommand(id, request.BranchId),
            cancellationToken);
        return Results.NoContent();
    })
    .WithName("AssignBranchToShipment")
    .WithTags("Shipments")
    .RequireAuthorization()
    .Produces(StatusCodes.Status204NoContent)
    .Produces(StatusCodes.Status400BadRequest)
    .Produces(StatusCodes.Status401Unauthorized)
    .Produces(StatusCodes.Status404NotFound);

var customers = app.MapGroup("/api/customers")
    .WithTags("Customers");

customers.MapGet("/", async (
        LogisticsDbContext db,
        int page = 1,
        int pageSize = 10,
        string? search = null,
        bool? activeOnly = null,
        CancellationToken cancellationToken = default) =>
    {
        var query = db.Customers.AsNoTracking();

        if (activeOnly == true)
        {
            query = query.Where(c => c.IsActive);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(c =>
                c.Dni.ToLower().Contains(term) ||
                c.FullName.ToLower().Contains(term) ||
                c.Email.ToLower().Contains(term));
        }

        var safePage = page < 1 ? 1 : page;
        var safePageSize = pageSize switch
        {
            < 1 => 10,
            > 100 => 100,
            _ => pageSize,
        };

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(c => c.FullName)
            .ThenBy(c => c.Dni)
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync(cancellationToken);

        return Results.Ok(new PagedResult<Customer>(items, totalCount, safePage, safePageSize));
    })
    .RequireAuthorization()
    .Produces<PagedResult<Customer>>(StatusCodes.Status200OK);

customers.MapGet("/by-dni/{dni}", async (string dni, LogisticsDbContext db, CancellationToken cancellationToken) =>
{
    if (string.IsNullOrWhiteSpace(dni))
    {
        return Results.BadRequest(new { detail = "DNI is required." });
    }

    var customer = await db.Customers
        .AsNoTracking()
        .FirstOrDefaultAsync(c => c.Dni == dni.Trim() && c.IsActive, cancellationToken);

    return customer is null ? Results.NotFound() : Results.Ok(customer);
})
    .RequireAuthorization();

customers.MapGet("/{id:guid}", async (Guid id, LogisticsDbContext db, CancellationToken cancellationToken) =>
{
    var customer = await db.Customers.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    return customer is null ? Results.NotFound() : Results.Ok(customer);
})
    .RequireAuthorization();

customers.MapPost("/", async (CreateCustomerRequest request, LogisticsDbContext db, CancellationToken cancellationToken) =>
{
    var normalizedDni = request.Dni.Trim();
    if (await db.Customers.AnyAsync(c => c.Dni == normalizedDni, cancellationToken))
    {
        return Results.Conflict(new { detail = "A customer with this DNI already exists." });
    }

    var customer = new Customer(Guid.NewGuid(), normalizedDni, request.FullName.Trim(), request.Email.Trim(), request.Phone.Trim());
    db.Customers.Add(customer);
    await db.SaveChangesAsync(cancellationToken);
    return Results.Created($"/api/customers/{customer.Id}", customer);
})
    .RequireAuthorization(policy => policy.RequireRole(UserRoles.Admin, UserRoles.Worker))
    .Produces(StatusCodes.Status409Conflict);

customers.MapPut("/{id:guid}", async (Guid id, UpdateCustomerRequest request, LogisticsDbContext db, CancellationToken cancellationToken) =>
{
    var customer = await db.Customers.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    if (customer is null) return Results.NotFound();

    var normalizedDni = request.Dni.Trim();
    if (await db.Customers.AnyAsync(c => c.Dni == normalizedDni && c.Id != id, cancellationToken))
    {
        return Results.Conflict(new { detail = "A customer with this DNI already exists." });
    }

    customer.Update(normalizedDni, request.FullName.Trim(), request.Email.Trim(), request.Phone.Trim());
    await db.SaveChangesAsync(cancellationToken);
    return Results.Ok(customer);
})
    .RequireAuthorization(policy => policy.RequireRole(UserRoles.Admin, UserRoles.Worker))
    .Produces(StatusCodes.Status409Conflict);

customers.MapPatch("/{id:guid}/status", async (Guid id, SetCustomerStatusRequest request, LogisticsDbContext db, CancellationToken cancellationToken) =>
{
    var customer = await db.Customers.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    if (customer is null) return Results.NotFound();

    if (request.IsActive)
    {
        customer.Activate();
    }
    else
    {
        customer.Deactivate();
    }

    await db.SaveChangesAsync(cancellationToken);
    return Results.Ok(customer);
})
    .RequireAuthorization(policy => policy.RequireRole(UserRoles.Admin));

var vehicles = app.MapGroup("/api/vehicles")
    .WithTags("Vehicles");

vehicles.MapGet("/", async (
        int page = 1,
        int pageSize = 10,
        string? search = null,
        bool? activeOnly = null,
        IMediator mediator = null!,
        CancellationToken cancellationToken = default) =>
    Results.Ok(await mediator.Send(
        new GetVehiclesPageQuery(page, pageSize, search, activeOnly),
        cancellationToken)))
    .RequireAuthorization()
    .Produces<PagedResult<VehicleDto>>(StatusCodes.Status200OK);

vehicles.MapGet("/{id:guid}", async (Guid id, IVehicleRepository repository, CancellationToken cancellationToken) =>
{
    var vehicle = await repository.GetByIdAsync(id, cancellationToken);
    return vehicle is null
        ? Results.NotFound()
        : Results.Ok(VehicleDtoMapper.ToDto(vehicle));
})
    .RequireAuthorization();

vehicles.MapPost("/", async (CreateVehicleRequest request, IMediator mediator, CancellationToken cancellationToken) =>
{
    var created = await mediator.Send(
        new CreateVehicleCommand(request.LicensePlate, request.Model, request.CapacityInKg),
        cancellationToken);

    return Results.Created($"/api/vehicles/{created.Id}", created);
})
    .RequireAuthorization(policy => policy.RequireRole(UserRoles.Admin))
    .Produces(StatusCodes.Status409Conflict);

vehicles.MapPut("/{id:guid}", async (Guid id, UpdateVehicleRequest request, IMediator mediator, CancellationToken cancellationToken) =>
    Results.Ok(await mediator.Send(
        new UpdateVehicleCommand(id, request.LicensePlate, request.Model, request.CapacityInKg),
        cancellationToken)))
    .RequireAuthorization(policy => policy.RequireRole(UserRoles.Admin))
    .Produces(StatusCodes.Status409Conflict);

vehicles.MapPatch("/{id:guid}/status", async (Guid id, SetVehicleStatusRequest request, IMediator mediator, CancellationToken cancellationToken) =>
    Results.Ok(await mediator.Send(new SetVehicleStatusCommand(id, request.IsActive), cancellationToken)))
    .RequireAuthorization(policy => policy.RequireRole(UserRoles.Admin));

var couriers = app.MapGroup("/api/couriers")
    .WithTags("Couriers");

couriers.MapGet("/", async (
        int page = 1,
        int pageSize = 10,
        string? search = null,
        bool? isAvailable = null,
        bool? activeOnly = null,
        IMediator mediator = null!,
        CancellationToken cancellationToken = default) =>
    Results.Ok(await mediator.Send(
        new GetCouriersPageQuery(page, pageSize, search, isAvailable, activeOnly),
        cancellationToken)))
    .RequireAuthorization()
    .Produces<PagedResult<CourierDto>>(StatusCodes.Status200OK);

couriers.MapGet("/{id:guid}", async (Guid id, ICourierRepository repository, CancellationToken cancellationToken) =>
{
    var courier = await repository.GetByIdAsync(id, cancellationToken);
    return courier is null
        ? Results.NotFound()
        : Results.Ok(CourierDtoMapper.ToDto(courier));
})
    .RequireAuthorization();

couriers.MapPost("/", async (CreateCourierRequest request, IMediator mediator, CancellationToken cancellationToken) =>
{
    var created = await mediator.Send(
        new CreateCourierCommand(
            request.FullName,
            request.Phone,
            request.IsAvailable,
            request.CurrentVehicleId),
        cancellationToken);

    return Results.Created($"/api/couriers/{created.Id}", created);
})
    .RequireAuthorization(policy => policy.RequireRole(UserRoles.Admin));

couriers.MapPut("/{id:guid}", async (Guid id, UpdateCourierRequest request, IMediator mediator, CancellationToken cancellationToken) =>
    Results.Ok(await mediator.Send(
        new UpdateCourierCommand(
            id,
            request.FullName,
            request.Phone,
            request.IsAvailable,
            request.CurrentVehicleId),
        cancellationToken)))
    .RequireAuthorization(policy => policy.RequireRole(UserRoles.Admin));

couriers.MapPatch("/{id:guid}/status", async (Guid id, SetCourierStatusRequest request, IMediator mediator, CancellationToken cancellationToken) =>
    Results.Ok(await mediator.Send(new SetCourierStatusCommand(id, request.IsActive), cancellationToken)))
    .RequireAuthorization(policy => policy.RequireRole(UserRoles.Admin));

var branches = app.MapGroup("/api/branches")
    .WithTags("Branches");

branches.MapGet("/", async (
        int page = 1,
        int pageSize = 10,
        string? search = null,
        bool? activeOnly = null,
        IMediator mediator = null!,
        CancellationToken cancellationToken = default) =>
    Results.Ok(await mediator.Send(
        new GetBranchesPageQuery(page, pageSize, search, activeOnly),
        cancellationToken)))
    .RequireAuthorization()
    .Produces<PagedResult<BranchDto>>(StatusCodes.Status200OK);

branches.MapGet("/{id:guid}", async (Guid id, IBranchRepository repository, CancellationToken cancellationToken) =>
{
    var branch = await repository.GetByIdAsync(id, cancellationToken);
    return branch is null
        ? Results.NotFound()
        : Results.Ok(BranchDtoMapper.ToDto(branch));
})
    .RequireAuthorization();

branches.MapPost("/", async (CreateBranchRequest request, IMediator mediator, CancellationToken cancellationToken) =>
{
    var created = await mediator.Send(
        new CreateBranchCommand(
            request.Phone,
            request.Name,
            request.Address,
            request.BusinessHours,
            request.Country,
            request.Department,
            request.Province,
            request.District),
        cancellationToken);

    return Results.Created($"/api/branches/{created.Id}", created);
})
    .RequireAuthorization(policy => policy.RequireRole(UserRoles.Admin))
    .Produces(StatusCodes.Status409Conflict);

branches.MapPut("/{id:guid}", async (Guid id, UpdateBranchRequest request, IMediator mediator, CancellationToken cancellationToken) =>
    Results.Ok(await mediator.Send(
        new UpdateBranchCommand(
            id,
            request.Phone,
            request.Name,
            request.Address,
            request.BusinessHours,
            request.Country,
            request.Department,
            request.Province,
            request.District),
        cancellationToken)))
    .RequireAuthorization(policy => policy.RequireRole(UserRoles.Admin))
    .Produces(StatusCodes.Status409Conflict);

branches.MapPatch("/{id:guid}/status", async (Guid id, SetBranchStatusRequest request, IMediator mediator, CancellationToken cancellationToken) =>
    Results.Ok(await mediator.Send(new SetBranchStatusCommand(id, request.IsActive), cancellationToken)))
    .RequireAuthorization(policy => policy.RequireRole(UserRoles.Admin));

app.MapHub<ShipmentHub>("/hubs/shipments");

app.MapFallbackToFile("index.html");

app.Run();

internal sealed record UpdateShipmentStatusRequest(
    ShipmentStatus NewStatus,
    string? Pin = null,
    bool? PaymentCollected = null);

internal sealed record AssignCourierRequest(Guid CourierId);
internal sealed record AssignBranchRequest(Guid BranchId);

internal sealed record CreateCustomerRequest(string Dni, string FullName, string Email, string Phone);
internal sealed record UpdateCustomerRequest(string Dni, string FullName, string Email, string Phone);
internal sealed record SetCustomerStatusRequest(bool IsActive);

internal sealed record CreateVehicleRequest(string LicensePlate, string Model, decimal CapacityInKg);
internal sealed record UpdateVehicleRequest(string LicensePlate, string Model, decimal CapacityInKg);
internal sealed record SetVehicleStatusRequest(bool IsActive);

internal sealed record CreateCourierRequest(string FullName, string Phone, bool IsAvailable, Guid? CurrentVehicleId = null);
internal sealed record UpdateCourierRequest(string FullName, string Phone, bool IsAvailable, Guid? CurrentVehicleId = null);
internal sealed record SetCourierStatusRequest(bool IsActive);

internal sealed record CreateBranchRequest(
    string Phone,
    string Name,
    string Address,
    string BusinessHours,
    string Country,
    string Department,
    string Province,
    string District);

internal sealed record UpdateBranchRequest(
    string Phone,
    string Name,
    string Address,
    string BusinessHours,
    string Country,
    string Department,
    string Province,
    string District);

internal sealed record SetBranchStatusRequest(bool IsActive);

internal sealed record CreateStaffUserRequest(
    string Username,
    string Password,
    string Role,
    Guid? BranchId);

internal sealed record UpdateStaffUserRequest(
    string Username,
    string Role,
    Guid? BranchId,
    string? Password);

internal sealed record SetStaffUserStatusRequest(bool IsActive);

internal sealed record CurrentUserProfileResponse(
    Guid Id,
    string Username,
    string Role,
    Guid? BranchId,
    string? BranchName);

internal sealed record RegisterClientRequest(
    string Username,
    string Password,
    string Dni,
    string FullName,
    string Email,
    string Phone);

internal sealed record RegisterClientResponse(
    Guid UserId,
    string Username,
    string Role,
    Guid CustomerId,
    string Dni,
    string FullName);
