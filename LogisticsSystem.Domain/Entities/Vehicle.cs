namespace LogisticsSystem.Domain.Entities;

public class Vehicle
{
    public Guid Id { get; private set; }
    public string LicensePlate { get; private set; }
    public string Model { get; private set; }
    public decimal CapacityInKg { get; private set; }
    public bool IsActive { get; private set; }

    private Vehicle()
    {
        LicensePlate = null!;
        Model = null!;
    }

    public Vehicle(Guid id, string licensePlate, string model, decimal capacityInKg)
    {
        if (id == Guid.Empty)
        {
            throw new ArgumentException("Id cannot be empty.", nameof(id));
        }

        ArgumentException.ThrowIfNullOrWhiteSpace(licensePlate);
        ArgumentException.ThrowIfNullOrWhiteSpace(model);

        if (capacityInKg <= 0m)
        {
            throw new ArgumentOutOfRangeException(nameof(capacityInKg), "Capacity must be greater than zero.");
        }

        Id = id;
        LicensePlate = licensePlate;
        Model = model;
        CapacityInKg = capacityInKg;
        IsActive = true;
    }

    public void Deactivate() => IsActive = false;

    public void Activate() => IsActive = true;

    public void Update(string licensePlate, string model, decimal capacityInKg)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(licensePlate);
        ArgumentException.ThrowIfNullOrWhiteSpace(model);

        if (capacityInKg <= 0m)
        {
            throw new ArgumentOutOfRangeException(nameof(capacityInKg), "Capacity must be greater than zero.");
        }

        LicensePlate = licensePlate;
        Model = model;
        CapacityInKg = capacityInKg;
    }
}
