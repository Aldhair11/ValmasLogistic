namespace LogisticsSystem.Domain.Entities;

public class Courier
{
    public Guid Id { get; private set; }
    public string FullName { get; private set; }
    public string Phone { get; private set; }
    public bool IsAvailable { get; private set; }
    public bool IsActive { get; private set; }
    public Guid? CurrentVehicleId { get; private set; }
    public Vehicle? CurrentVehicle { get; private set; }

    private Courier()
    {
        FullName = null!;
        Phone = null!;
    }

    public Courier(Guid id, string fullName, string phone, bool isAvailable, Guid? currentVehicleId = null)
    {
        if (id == Guid.Empty)
        {
            throw new ArgumentException("Id cannot be empty.", nameof(id));
        }

        ArgumentException.ThrowIfNullOrWhiteSpace(fullName);
        ArgumentException.ThrowIfNullOrWhiteSpace(phone);

        Id = id;
        FullName = fullName;
        Phone = phone;
        IsAvailable = isAvailable;
        CurrentVehicleId = currentVehicleId;
        IsActive = true;
    }

    public void Deactivate()
    {
        IsActive = false;
        IsAvailable = false;
    }

    public void Activate() => IsActive = true;

    public void Update(string fullName, string phone, bool isAvailable, Guid? currentVehicleId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(fullName);
        ArgumentException.ThrowIfNullOrWhiteSpace(phone);

        FullName = fullName;
        Phone = phone;
        IsAvailable = IsActive && isAvailable;
        CurrentVehicleId = currentVehicleId;
    }

    public void AssignVehicle(Guid? vehicleId)
    {
        CurrentVehicleId = vehicleId;
    }
}
