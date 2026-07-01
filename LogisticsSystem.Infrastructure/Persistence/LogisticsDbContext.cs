using LogisticsSystem.Domain.Constants;
using LogisticsSystem.Domain.Entities;
using LogisticsSystem.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LogisticsSystem.Infrastructure.Persistence;

public class LogisticsDbContext : DbContext
{
    public LogisticsDbContext(DbContextOptions<LogisticsDbContext> options)
        : base(options)
    {
    }

    public DbSet<Shipment> Shipments => Set<Shipment>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<Courier> Couriers => Set<Courier>();
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users");
            entity.HasKey(u => u.Id);
            entity.Property(u => u.Id).ValueGeneratedNever();
            entity.Property(u => u.Username).HasMaxLength(100).IsRequired();
            entity.HasIndex(u => u.Username).IsUnique();
            entity.Property(u => u.PasswordHash).HasMaxLength(200).IsRequired();
            entity.Property(u => u.Role).HasMaxLength(20).IsRequired();

            entity.HasOne(u => u.CustomerProfile)
                .WithMany()
                .HasForeignKey(u => u.CustomerProfileId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(u => u.Branch)
                .WithMany()
                .HasForeignKey(u => u.BranchId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.Property(u => u.IsActive).HasDefaultValue(true).IsRequired();

            entity.HasData(SecuritySeedData.CreateAdminUser());
        });

        modelBuilder.Entity<Customer>(entity =>
        {
            entity.ToTable("Customers");
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Id).ValueGeneratedNever();
            entity.Property(c => c.Dni).HasMaxLength(20).IsRequired();
            entity.HasIndex(c => c.Dni).IsUnique();
            entity.Property(c => c.FullName).HasMaxLength(200).IsRequired();
            entity.Property(c => c.Email).HasMaxLength(200).IsRequired();
            entity.Property(c => c.Phone).HasMaxLength(30).IsRequired();
            entity.Property(c => c.IsActive).HasDefaultValue(true).IsRequired();
        });

        modelBuilder.Entity<Vehicle>(entity =>
        {
            entity.ToTable("Vehicles");
            entity.HasKey(v => v.Id);
            entity.Property(v => v.Id).ValueGeneratedNever();
            entity.Property(v => v.LicensePlate).HasMaxLength(20).IsRequired();
            entity.HasIndex(v => v.LicensePlate).IsUnique();
            entity.Property(v => v.Model).HasMaxLength(100).IsRequired();
            entity.Property(v => v.CapacityInKg).HasColumnType("TEXT").IsRequired();
            entity.Property(v => v.IsActive).HasDefaultValue(true).IsRequired();
        });

        modelBuilder.Entity<Courier>(entity =>
        {
            entity.ToTable("Couriers");
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Id).ValueGeneratedNever();
            entity.Property(c => c.FullName).HasMaxLength(200).IsRequired();
            entity.Property(c => c.Phone).HasMaxLength(30).IsRequired();
            entity.Property(c => c.IsAvailable).IsRequired();
            entity.Property(c => c.IsActive).HasDefaultValue(true).IsRequired();

            entity.HasOne(c => c.CurrentVehicle)
                .WithMany()
                .HasForeignKey(c => c.CurrentVehicleId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Branch>(entity =>
        {
            entity.ToTable("Branches");
            entity.HasKey(b => b.Id);
            entity.Property(b => b.Id).ValueGeneratedNever();
            entity.Property(b => b.Phone).HasMaxLength(30).IsRequired();
            entity.Property(b => b.Name).HasMaxLength(150).IsRequired();
            entity.Property(b => b.Address).HasMaxLength(300).IsRequired();
            entity.Property(b => b.BusinessHours).HasMaxLength(100).IsRequired();
            entity.Property(b => b.Country).HasMaxLength(100).IsRequired();
            entity.Property(b => b.Department).HasMaxLength(100).IsRequired();
            entity.Property(b => b.Province).HasMaxLength(100).IsRequired();
            entity.Property(b => b.District).HasMaxLength(100).IsRequired();
            entity.Property(b => b.IsActive).HasDefaultValue(true).IsRequired();
        });

        modelBuilder.Entity<Shipment>(entity =>
        {
            entity.ToTable("Shipments");

            entity.HasKey(s => s.Id);

            entity.Property(s => s.Id)
                .ValueGeneratedNever();

            entity.Property(s => s.WeightInKg)
                .HasColumnType("TEXT")
                .IsRequired();

            entity.Property(s => s.Status)
                .HasConversion<string>()
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(s => s.CreatedAt)
                .IsRequired();

            entity.Property(s => s.TrackingNumber)
                .HasMaxLength(10)
                .IsRequired();

            entity.HasIndex(s => s.TrackingNumber)
                .IsUnique();

            entity.Property(s => s.DeliveryPin)
                .HasMaxLength(4)
                .IsRequired();

            entity.Property(s => s.PaymentMethod)
                .HasConversion<string>()
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(s => s.ShippingAmount)
                .HasColumnType("TEXT")
                .IsRequired();

            entity.Property(s => s.IsPaid)
                .HasDefaultValue(false)
                .IsRequired();

            entity.Property(s => s.PaidAt);

            entity.Property(s => s.Type)
                .HasConversion<string>()
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(s => s.Size)
                .HasConversion<string>()
                .HasMaxLength(10)
                .IsRequired();

            entity.Property(s => s.IsFragile)
                .IsRequired();

            entity.Property(s => s.ContentDescription)
                .HasMaxLength(500)
                .IsRequired();

            entity.Property(s => s.PickupRequired)
                .IsRequired();

            entity.Property(s => s.DeliveryType)
                .HasConversion<string>()
                .HasMaxLength(20)
                .IsRequired();

            entity.HasOne(s => s.Sender)
                .WithMany()
                .HasForeignKey(s => s.SenderId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(s => s.Recipient)
                .WithMany()
                .HasForeignKey(s => s.RecipientId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(s => s.AssignedCourier)
                .WithMany()
                .HasForeignKey(s => s.AssignedCourierId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(s => s.CurrentBranch)
                .WithMany()
                .HasForeignKey(s => s.CurrentBranchId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(s => s.DestinationBranch)
                .WithMany()
                .HasForeignKey(s => s.DestinationBranchId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.OwnsOne(s => s.Origin, owned =>
            {
                owned.Property(a => a.Street)
                    .HasColumnName("Origin_Street")
                    .HasMaxLength(200)
                    .IsRequired();

                owned.Property(a => a.City)
                    .HasColumnName("Origin_City")
                    .HasMaxLength(100)
                    .IsRequired();

                owned.Property(a => a.State)
                    .HasColumnName("Origin_State")
                    .HasMaxLength(100)
                    .IsRequired();

                owned.Property(a => a.ZipCode)
                    .HasColumnName("Origin_ZipCode")
                    .HasMaxLength(20)
                    .IsRequired();
            });

            entity.OwnsOne(s => s.Destination, owned =>
            {
                owned.Property(a => a.Street)
                    .HasColumnName("Destination_Street")
                    .HasMaxLength(200)
                    .IsRequired();

                owned.Property(a => a.City)
                    .HasColumnName("Destination_City")
                    .HasMaxLength(100)
                    .IsRequired();

                owned.Property(a => a.State)
                    .HasColumnName("Destination_State")
                    .HasMaxLength(100)
                    .IsRequired();

                owned.Property(a => a.ZipCode)
                    .HasColumnName("Destination_ZipCode")
                    .HasMaxLength(20)
                    .IsRequired();
            });

            entity.Navigation(s => s.Origin).IsRequired();
            entity.Navigation(s => s.Destination).IsRequired();
        });
    }
}
