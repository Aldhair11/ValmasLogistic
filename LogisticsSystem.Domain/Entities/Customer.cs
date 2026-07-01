namespace LogisticsSystem.Domain.Entities;

public class Customer
{
    public Guid Id { get; private set; }
    public string Dni { get; private set; }
    public string FullName { get; private set; }
    public string Email { get; private set; }
    public string Phone { get; private set; }
    public bool IsActive { get; private set; }

    private Customer()
    {
        Dni = null!;
        FullName = null!;
        Email = null!;
        Phone = null!;
    }

    public Customer(Guid id, string dni, string fullName, string email, string phone)
    {
        if (id == Guid.Empty)
        {
            throw new ArgumentException("Id cannot be empty.", nameof(id));
        }

        ArgumentException.ThrowIfNullOrWhiteSpace(dni);
        ArgumentException.ThrowIfNullOrWhiteSpace(fullName);
        ArgumentException.ThrowIfNullOrWhiteSpace(email);
        ArgumentException.ThrowIfNullOrWhiteSpace(phone);

        Id = id;
        Dni = dni;
        FullName = fullName;
        Email = email;
        Phone = phone;
        IsActive = true;
    }

    public void Deactivate() => IsActive = false;

    public void Activate() => IsActive = true;

    public void Update(string dni, string fullName, string email, string phone)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(dni);
        ArgumentException.ThrowIfNullOrWhiteSpace(fullName);
        ArgumentException.ThrowIfNullOrWhiteSpace(email);
        ArgumentException.ThrowIfNullOrWhiteSpace(phone);

        Dni = dni;
        FullName = fullName;
        Email = email;
        Phone = phone;
    }
}
