namespace LogisticsSystem.Domain.Entities;

public class Branch
{
    public Guid Id { get; private set; }
    public string Phone { get; private set; }
    public string Name { get; private set; }
    public string Address { get; private set; }
    public string BusinessHours { get; private set; }
    public string Country { get; private set; }
    public string Department { get; private set; }
    public string Province { get; private set; }
    public string District { get; private set; }
    public bool IsActive { get; private set; }

    private Branch()
    {
        Phone = null!;
        Name = null!;
        Address = null!;
        BusinessHours = null!;
        Country = null!;
        Department = null!;
        Province = null!;
        District = null!;
    }

    public Branch(
        Guid id,
        string phone,
        string name,
        string address,
        string businessHours,
        string country,
        string department,
        string province,
        string district)
    {
        if (id == Guid.Empty)
        {
            throw new ArgumentException("Id cannot be empty.", nameof(id));
        }

        ArgumentException.ThrowIfNullOrWhiteSpace(phone);
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(address);
        ArgumentException.ThrowIfNullOrWhiteSpace(businessHours);
        ArgumentException.ThrowIfNullOrWhiteSpace(country);
        ArgumentException.ThrowIfNullOrWhiteSpace(department);
        ArgumentException.ThrowIfNullOrWhiteSpace(province);
        ArgumentException.ThrowIfNullOrWhiteSpace(district);

        Id = id;
        Phone = phone.Trim();
        Name = name.Trim();
        Address = address.Trim();
        BusinessHours = businessHours.Trim();
        Country = country.Trim();
        Department = department.Trim();
        Province = province.Trim();
        District = district.Trim();
        IsActive = true;
    }

    public void Deactivate() => IsActive = false;

    public void Activate() => IsActive = true;

    public void Update(
        string phone,
        string name,
        string address,
        string businessHours,
        string country,
        string department,
        string province,
        string district)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(phone);
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(address);
        ArgumentException.ThrowIfNullOrWhiteSpace(businessHours);
        ArgumentException.ThrowIfNullOrWhiteSpace(country);
        ArgumentException.ThrowIfNullOrWhiteSpace(department);
        ArgumentException.ThrowIfNullOrWhiteSpace(province);
        ArgumentException.ThrowIfNullOrWhiteSpace(district);

        Phone = phone.Trim();
        Name = name.Trim();
        Address = address.Trim();
        BusinessHours = businessHours.Trim();
        Country = country.Trim();
        Department = department.Trim();
        Province = province.Trim();
        District = district.Trim();
    }
}
